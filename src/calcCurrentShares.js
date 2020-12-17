const reduce = require('lodash/reduce')

const Big = require('big.js')

// this function calculates the owned shares based on the passed activities.
module.exports = function calcCurrentShares (activities) {
  if (activities.length === 0) {
    return 0
  }

  const zero = Big(0)

  return (
    +reduce(
      activities,
      (sum, x) => {
        switch (x.type) {
          case 'TransferIn':
          case 'Buy':
            return sum.plus(Big(x.shares))
          case 'TransferOut':
          case 'Sell':
            return sum.minus(Big(x.shares))
          default:
            return sum
        }
      },
      zero
    ) || +zero
  )
}
