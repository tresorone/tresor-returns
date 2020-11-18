const sumBy = require('lodash/sumBy')

module.exports = function calcPurchasePrice (purchases) {
  const value = sumBy(purchases, p => p.shares * p.price)
  const price = value / sumBy(purchases, 'shares') || 0

  return { purchaseValue: value, purchasePrice: price }
}
