const Big = require('big.js')

const calcCurrentShares = require('./calcCurrentShares')
const { applySplitMultiplier, getDateArr, normalizeQuotes } = require('../utils')

module.exports = function (activities, quotes, interval) {
  if (activities.length === 0) {
    return {
      history: [],
      dates: []
    }
  }

  // adjust shares bought/sold by splits that happened in the past
  activities = applySplitMultiplier(activities)

  // console.table(activitiesInInterval);

  // create an array of all days from today to the first activity
  const dateArrFull = getDateArr(interval)

  const period = 1

  // if (dateArrFull.length > 3000) {
  //   period = 21
  // } else if (dateArrFull.length > 600) {
  //   period = 5
  // }

  const dateArr = dateArrFull.filter((q, i) => i % period === 0)

  // get normalized quotes (so every day of dateArr has a price)
  const quotesNormalized = normalizeQuotes(quotes, dateArr)

  let sharesStorage = Big(0)
  const sharesOfHolding = dateArr.map((day, i) => {
    const todaysActivities = activities.filter(a => day === a.date)
    const sharesDelta = calcCurrentShares(todaysActivities)

    const todaysShares = sharesStorage.plus(Big(sharesDelta))
    sharesStorage = todaysShares

    const price = quotesNormalized[i].price || 0
    const value = +todaysShares * price

    return value
  })

  return {
    history: sharesOfHolding,
    dates: dateArr
  }
}
