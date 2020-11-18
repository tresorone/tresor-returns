const calcCurrentShares = require('./src/calcCurrentShares')
const calcValueHistory = require('./src/calcValueHistory')
const calcStartingValueHistory = require('./src/calcStartingValueHistory')
const calcInventoryPurchasesFIFO = require('./src/calcInventoryPurchasesFIFO')
const calcPurchasePrice = require('./src/calcPurchasePrice')
const utils = require('./utils')

module.exports = {
  calcInventoryPurchasesFIFO,
  calcPurchasePrice,
  calcCurrentShares,
  calcValueHistory,
  calcStartingValueHistory,
  utils
}
