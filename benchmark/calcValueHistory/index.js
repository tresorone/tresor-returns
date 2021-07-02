const groupBy = require('lodash/groupBy');
const orderBy = require('lodash/orderBy');
const { format } = require('date-fns');
const activities = require('./fixtures/activities.json');
const quotes = require('./fixtures/quotes.json');

const calcValueHistory = require('../../src/calcValueHistory');

const activitiesFilered = activities.filter((a) =>
  ['Buy', 'Sell', 'split', 'reversesplit', 'TransferIn', 'TransferOut'].includes(a.type),
);

const activitiesByHolding = groupBy(activitiesFilered, 'holding');

function getEarliestActivity(values) {
  if (!values.length) {
    return format(new Date(), 'yyyy-MM-dd');
  }

  return orderBy(values, (a) => new Date(a), ['asc'])[0].date;
}

const start = new Date();

Object.entries(activitiesByHolding).forEach(([holdingId, activitiesOfHolding]) => {
  activitiesOfHolding = orderBy(activitiesOfHolding, (a) => new Date(a), 'desc').reverse();
  const quotesOfHolding = quotes[holdingId];
  const earliestActivity = getEarliestActivity(activitiesOfHolding);
  const now = format(new Date(), 'yyyy-MM-dd');

  const interval = {
    start: earliestActivity,
    end: now,
  };

  calcValueHistory(activitiesOfHolding, quotesOfHolding, interval);
});

const end = new Date();
const total = end - start;
const holdingsCount = Object.keys(activitiesByHolding).length;
const average = parseInt(total / holdingsCount, 10);

console.info(`Total:\t\t${total}ms
Average: \t${average}ms
Holdings:\t${holdingsCount}`);
