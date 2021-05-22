const cloneDeep = require('lodash/cloneDeep');
const filter = require('lodash/filter');
const partition = require('lodash/partition');
const keyBy = require('lodash/keyBy');
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

module.exports = {
  applySplitMultiplier,
  getDateArr,
  normalizeQuotes,
  getPreviousValue,
};
