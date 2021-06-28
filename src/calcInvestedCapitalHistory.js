const sumBy = require('lodash/sumBy');
const minBy = require('lodash/minBy');
const { format } = require('date-fns');

const { applySplitMultiplier, getDateArr, calcSalesDataFIFO } = require('../utils');

module.exports = function (activities, interval) {
  if (activities.length === 0) {
    return {
      capitalHistory: [],
      dates: [],
    };
  }

  // adjust shares bought/sold by splits that happened in the past
  const tempActivities = applySplitMultiplier(activities);

  // add "buyAmount" do sales data
  const adjustedActivities = calcSalesDataFIFO(tempActivities);

  // create an array of all days from today to the first activity
  // we ignore the passed interval here because the calculation needs to happen across the entire activities array
  // with the passed interval, we will just cut off the resulting array
  const earliestActivity = minBy(adjustedActivities, (a) => new Date(a.date));
  const dateArr = getDateArr({
    start: earliestActivity.date,
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const requestedDateArr = getDateArr(interval);

  const capitalHistory = [];
  let investedStorage = 0;

  dateArr.forEach((d) => {
    const thatDay = format(new Date(d), 'yyyy-MM-dd');

    // find activities from thatDay and add the buy amounts and subtract a sales original buyAmount to get the capitalFlow
    const activitiesForInvestedValue = adjustedActivities
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
    capitalHistory: capitalHistory.filter((v, i) => requestedDateArr.includes(dateArr[i])),
    dates: requestedDateArr,
  };
};
