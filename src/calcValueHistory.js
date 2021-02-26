const partition = require('lodash/partition');
const isBefore = require('date-fns/isBefore');
const Big = require('big.js');

const calcCurrentShares = require('./calcCurrentShares');

const { applySplitMultiplier, getDateArr, normalizeQuotes } = require('../utils');

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

  let sharesStorage = Big(sharesAtStart);
  const valueOfHoldingOverTime = dateArr.map((d, i) => {
    const day = d;
    const todaysActivities = activitiesInInterval.filter((a) => day === a.date);
    const sharesDelta = calcCurrentShares(todaysActivities);

    const todaysShares = sharesStorage.plus(Big(sharesDelta));
    sharesStorage = todaysShares;

    const price = quotesNormalized[i].price || 0;
    const value = +todaysShares * price;

    return value;
  });

  return {
    history: valueOfHoldingOverTime,
    dates: dateArr,
  };
};
