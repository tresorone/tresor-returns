const sumBy = require('lodash/sumBy');

const { applySplitMultiplier, getDateArr, normalizeQuotes } = require('../utils');
const { format } = require('date-fns');
const { cloneDeep, orderBy } = require('lodash');
const Big = require('big.js');

function calcSalesDataFIFO(activities) {
  activities = orderBy(cloneDeep(activities), 'date', 'asc');

  // we will make changes to sales that should be reflected in the activities collection
  const sales = activities.filter((a) => ['Sell', 'TransferOut'].includes(a.type));

  // we clone purchases again as the changes we will make below are temporary and should not be returned
  const purchases = cloneDeep(activities.filter((a) => ['Buy', 'TransferIn'].includes(a.type)));

  sales.forEach((sale) => {
    const { shares } = sale;
    sale.buyAmount = 0;

    function calc(sellShares) {
      const purchase = purchases[0];
      if (!purchase) {
        return;
      }

      const buyShares = purchase.shares;
      const buyPrice = purchase.price;

      const sharesSoldInThisPurchase = Math.min(buyShares, sellShares);
      const remainingShares = +Big(buyShares).minus(Big(sellShares));

      purchase.shares = remainingShares;
      sale.buyAmount += buyPrice * sharesSoldInThisPurchase;

      if (remainingShares <= 0) {
        purchases.shift();
      }

      if (remainingShares < 0) {
        calc(Math.abs(remainingShares));
      }
    }

    calc(shares);
  });

  return activities;
}

module.exports = function (activities, interval) {
  if (activities.length === 0) {
    return {
      capitalHistory: [],
      dates: [],
    };
  }

  // adjust shares bought/sold by splits that happened in the past
  activities = applySplitMultiplier(activities);

  // add "buyAmount" do sales data
  activities = calcSalesDataFIFO(activities);

  // create an array of all days from today to the first activity
  const dateArr = getDateArr(interval);

  const capitalHistory = [];
  let investedStorage = 0;

  dateArr.forEach((d) => {
    const thatDay = format(new Date(d), 'yyyy-MM-dd');

    // find activities from thatDay and add the buy amounts and subtract a sales original buyAmount to get the capitalFlow
    const activitiesForInvestedValue = activities
      .filter((a) => a.date === thatDay)
      .filter((a) => ['Sell', 'Buy'].includes(a.type))
      .map((a) => {
        return {
          ...a,
          capitalFlow: a.type === 'Sell' ? a.buyAmount * -1 : a.amount,
        };
      });

    // add the capitalFlow over time, resulting in the capitalHistory
    investedStorage += sumBy(activitiesForInvestedValue, 'capitalFlow');
    capitalHistory.push(investedStorage);
  });

  return {
    capitalHistory,
    dates: dateArr,
  };
};
