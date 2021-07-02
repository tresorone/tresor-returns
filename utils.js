const cloneDeep = require('lodash/cloneDeep');
const filter = require('lodash/filter');
const partition = require('lodash/partition');
const keyBy = require('lodash/keyBy');
const orderBy = require('lodash/orderBy');
const Big = require('big.js');
const { format, eachDayOfInterval, parse, isAfter, isBefore } = require('date-fns');

function applySplitMultiplier(activities) {
  activities = cloneDeep(activities);

  const splits = filter(
    filter(activities, (a) => a.type === 'split'),
    (a) => !isAfter(new Date(a.date), new Date()),
  );

  // multiply all shares from activities <= split date with the split multiplier
  splits.forEach((s) => {
    const activitiesBeforeSplit = filter(
      activities,
      (a) =>
        ['Buy', 'Sell', 'TransferIn', 'TransferOut'].includes(a.type) && isAfter(new Date(s.date), new Date(a.date)),
    );

    activitiesBeforeSplit.forEach((a) => {
      a.shares = +Big(a.shares).times(Big(s.multiplier));
      a.price = +Big(a.price).div(Big(s.multiplier));
    });
  });

  return activities;
}

function getDateArr(interval) {
  const startDate = new Date(parse(interval.start, 'yyyy-MM-dd', new Date()));
  const endDate = new Date(parse(interval.end, 'yyyy-MM-dd', new Date()));
  const eachDay = eachDayOfInterval({ start: startDate, end: endDate });

  const dateArr = eachDay.map((d, i) => format(d, 'yyyy-MM-dd'));

  return dateArr;
}

// iterate all dates verifing if it have a price in the quotes
// we save the last founded price to fill the next dates without price
// if a date dont have price it will be filled with the previous price we save
// when the first price was found, if exists, we fill the firsts empty elements
// the output will be the dates array and every day will have a price
function normalizeQuotes(quotes = [], dates) {
  // set starting quote price to the price that is CLOSEST before the dates interval
  const [quotesBeforeInterval, quotesInInterval] = partition(quotes, (q) =>
    isBefore(new Date(q.date), new Date(dates[0])),
  );
  const lastQuoteBeforeInterval = quotesBeforeInterval[0];

  const quotesByDate = keyBy(quotesInInterval, 'date');
  let price = lastQuoteBeforeInterval?.price || 0;
  let priceFound = price || false;
  const quotesPerDay = [];

  for (let i = 0; i < dates.length; i++) {
    const t = dates[i];
    const q = quotesByDate[t];

    if (q && q.price) {
      price = q.price;

      // Fills empty starting values by take the first empty elements of the array and fill in the first price that was found.
      if (!priceFound) {
        quotesPerDay.slice(0, i).map((q) => (q.price = price));
        priceFound = true;
      }
    }

    quotesPerDay.push({
      date: t,
      price,
    });
  }

  return quotesPerDay;
}

function getPreviousValue(arr, i) {
  if (i === 0) {
    return arr.find((x) => x != null);
  }

  const prev = arr[i - 1];

  if (prev === null) {
    return getPreviousValue(arr, i - 1);
  } else {
    return prev;
  }
}

function calcSalesDataFIFO(activities) {
  // order asc - it's necessary for a FIFO loop. earliest/oldest activity is first in the array. Latest/newest is last
  orderedActivities = orderBy(cloneDeep(activities), (a) => new Date(a), 'asc');

  // we will make changes to sales that should be reflected in the activities collection
  const sales = orderedActivities.filter((a) => ['Sell', 'TransferOut'].includes(a.type));

  // we clone purchases again as the changes we will make below are temporary and should not be returned
  const purchases = cloneDeep(orderedActivities.filter((a) => ['Buy', 'TransferIn'].includes(a.type)));

  /**
   * Alright, in here we will loop through sales
   * and then start with the first purchase to see how much we paid originally
   * for the shares we are selling here
   */
  sales.forEach((sale) => {
    const { shares } = sale;
    sale.buyAmount = 0;

    // alright let's do the FIFO magic in here
    function calc(sellShares) {
      const purchase = purchases[0];
      if (!purchase) {
        return;
      }

      // get the shares and the price of the first purchase
      const buyShares = purchase.shares;
      const buyPrice = purchase.price;

      // check how many shares were actually sold in this purchase
      const sharesSoldInThisPurchase = Math.min(buyShares, sellShares);

      // these are the remaining shares, in case we sold more shares than we bought in this purchase
      // this means there are more purchases where we need to calc the remaining shares against
      const remainingShares = +Big(buyShares).minus(Big(sellShares));

      // store the remaining shares on the purchase - for the next sale that will happen
      purchase.shares = remainingShares;

      // store the amount of this purchase to our sale
      sale.buyAmount += buyPrice * sharesSoldInThisPurchase;

      // if no shares are left (all of this purchase was sold in the sale), remove the purchase
      if (remainingShares <= 0) {
        purchases.shift();
      }

      // if the remaining shares are negative (ie we sold more than we bought in this purchase)
      // restart this calculation with the remaining shares as "sellShares"
      if (remainingShares < 0) {
        calc(Math.abs(remainingShares));
      }
    }

    // kick FIFO off
    calc(shares);
  });

  return orderedActivities;
}

module.exports = {
  calcSalesDataFIFO,
  applySplitMultiplier,
  getDateArr,
  normalizeQuotes,
  getPreviousValue,
};
