const partition = require('lodash/partition');
const sumBy = require('lodash/sumBy');
const isBefore = require('date-fns/isBefore');

const calcInventoryPurchasesFIFO = require('./calcInventoryPurchasesFIFO');
const calcCurrentShares = require('./calcCurrentShares');
const calcPurchasePrice = require('./calcPurchasePrice');

const { applySplitMultiplier, getDateArr } = require('../utils');

module.exports = function (activities, interval, priceAtStart) {
  // adjust shares bought/sold by splits that happened in the past
  activities = applySplitMultiplier(activities);

  const startDate = new Date(interval.start);
  const [activitiesBeforeInterval, activitiesInInterval] = partition(activities, (a) =>
    isBefore(new Date(a.date), startDate),
  );

  const sharesAtStart = calcCurrentShares(activitiesBeforeInterval);

  const dateArr = getDateArr(interval);

  // this is the holding position and the beginning of the interval, wrapped as a Buy activity
  const beforeIntervalActivity = {
    type: 'Buy',
    date: interval.start,
    price: priceAtStart,
    shares: sharesAtStart,
    amount: priceAtStart * sharesAtStart,
  };

  const realizedGainsHistory = [];
  const dividendGainsHistory = [];

  const startValueHistory = dateArr.map((d, i) => {
    const [activitiesUntilNow] = partition(activitiesInInterval, (a) => !isAfter(new Date(a.date), new Date(d)));

    // interval data, including the purchases before the interval as one starting purchase activity
    const { purchases: purchasesForInterval, realizedGains } = calcInventoryPurchasesFIFO([
      ...activitiesUntilNow,
      beforeIntervalActivity,
    ]);

    // starting value is the value of the holding at the beginning of the interval
    const { purchaseValue: startingValue } = calcPurchasePrice(purchasesForInterval);

    const dividends = activitiesUntilNow.filter((a) => a.type === 'Dividend');
    const dividendGains = sumBy(dividends, 'amount');

    dividendGainsHistory.push(dividendGains);
    realizedGainsHistory.push(realizedGains);

    return startingValue;
  });

  return {
    dates: dateArr,
    startValueHistory,
    realizedGainsHistory,
    dividendGainsHistory,
  };
};
