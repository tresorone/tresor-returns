const partition = require('lodash/partition')
const isBefore = require('date-fns/isBefore')
const isAfter = require('date-fns/isAfter')
const Big = require('big.js')

const calcInventoryPurchasesFIFO = require('./calcInventoryPurchasesFIFO')
const calcCurrentShares = require('./calcCurrentShares')
const calcPurchasePrice = require('./calcPurchasePrice')

const { applySplitMultiplier, getDateArr } = require('../utils')

module.exports = function (activities, interval, priceAtStart) {
  // adjust shares bought/sold by splits that happened in the past
  activities = applySplitMultiplier(activities)

  const startDate = new Date(interval.start)
  const [activitiesBeforeInterval, activitiesInInterval] = partition(
    activities,
    a => isBefore(new Date(a.date), startDate)
  )

  const sharesAtStart = calcCurrentShares(activitiesBeforeInterval)

  const dateArr = getDateArr(interval)

  // this is the holding position and the beginning of the interval, wrapped as a Buy activity
  const beforeIntervalActivity = {
    type: 'Buy',
    date: interval.start,
    price: priceAtStart,
    shares: sharesAtStart,
    amount: priceAtStart * sharesAtStart
  }

  const startValueHistory = dateArr.map((d, i) => {
    const [activitiesUntilNow] = partition(
      activitiesInInterval,
      a => !isAfter(new Date(a.date), new Date(d))
    )

    // interval data, including the purchases before the interval as one starting purchase activity
    const { purchases: purchasesForInterval } = calcInventoryPurchasesFIFO([
      ...activitiesUntilNow,
      beforeIntervalActivity
    ])

    // starting value is the value of the holding at the beginning of the interval
    const { purchaseValue: startingValue } = calcPurchasePrice(
      purchasesForInterval
    )

    return startingValue
  })

  return {
    dates: dateArr,
    startValueHistory
  }
}
