const partition = require('lodash/partition');
const isBefore = require('date-fns/isBefore');
const Big = require('big.js');

const { applySplitMultiplier, getDateArr, normalizeQuotes } = require('../utils');
const calcInventoryPurchasesFIFO = require('./calcInventoryPurchasesFIFO');
const calcCurrentShares = require('./calcCurrentShares');
const calcPurchasePrice = require('./calcPurchasePrice');

module.exports = function (activities, quotes, interval, i) {
  if (activities.length === 0) {
    return {
      history: [],
      dates: [],
    };
  }

  // adjust shares bought/sold by splits that happened in the past
  activities = applySplitMultiplier(activities);

  const startDate = new Date(interval.start);
  const [activitiesBeforeInterval, activitiesInInterval] = partition(activities, (a) =>
    isBefore(new Date(a.date), startDate),
  );

  const sharesAtStart = calcCurrentShares(activitiesBeforeInterval);

  // create an array of all days from today to the first activity
  const dateArr = getDateArr(interval);

  // get normalized quotes (so every day of dateArr has a price)
  const quotesNormalized = normalizeQuotes(quotes, dateArr);

  let sharesStorage = sharesAtStart;
  const valueOfHoldingOverTime = dateArr.map((day, i) => {
    const currentPrice = quotesNormalized[i].price;

    const beforeIntervalActivity = {
      type: 'Buy',
      date: day,
      price: currentPrice,
      shares: sharesStorage,
      amount: sharesStorage * currentPrice,
    };

    const todaysActivities = activitiesInInterval.filter((a) => day === a.date);
    const activitiesUntilNow = [...todaysActivities, beforeIntervalActivity];
    const { purchases: purchasesUntilNow } = calcInventoryPurchasesFIFO(activitiesUntilNow);

    const { purchaseValue } = calcPurchasePrice(purchasesUntilNow);

    sharesStorage = calcCurrentShares(activitiesUntilNow);

    return purchaseValue;
  });

  return {
    history: valueOfHoldingOverTime,
    dates: dateArr,
  };
};
