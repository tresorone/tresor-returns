const groupBy = require('lodash/groupBy')
const orderBy = require('lodash/orderBy')
const minBy = require('lodash/minBy')
const { format } = require('date-fns')
const activities = require('./fixtures/activities.json')
const quotes = require('./fixtures/quotes.json')

const calcValueHistory = require('../../src/calcValueHistory')

const activitiesFiltered = activities.filter(a => ['Buy', 'Sell', 'split'].includes(a.type))
const activitiesByHolding = groupBy(activitiesFiltered, 'isin')

function getEarliestActivity (values) {
  const earliest = minBy(values, x => new Date(x.date)) || {}

  return new Date((earliest.date && earliest.date.$date) || new Date())
}

const start = new Date()

Object.entries(activitiesByHolding).forEach(([holdingId, activitiesOfHolding]) => {
  activitiesOfHolding = orderBy(activitiesOfHolding, 'date', 'desc').reverse()
  const quotesOfHolding = quotes[holdingId]
  const earliestActivity = getEarliestActivity(activitiesOfHolding)

  const interval = {
    start: format(earliestActivity, 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  }

  calcValueHistory(activitiesOfHolding, quotesOfHolding, interval)
})

const end = new Date()
const total = end - start
const holdingsCount = Object.keys(activitiesByHolding).length
const average = parseInt(total / holdingsCount, 10)

console.info(`Total:\t\t${total}ms
Average: \t${average}ms
Holdings:\t${holdingsCount}`)
