const calcCurrentShares = require('./src/calcCurrentShares');
const calcValueHistory = require('./src/calcValueHistory');
const calcStartingValueHistory = require('./src/calcStartingValueHistory');
const calcInventoryPurchasesFIFO = require('./src/calcInventoryPurchasesFIFO');
const calcPurchasePrice = require('./src/calcPurchasePrice');
const calcInvestedCapitalHistory = require('./src/calcInvestedCapitalHistory');
const utils = require('./utils');

module.exports = {
  calcInventoryPurchasesFIFO,
  calcPurchasePrice,
  calcInvestedCapitalHistory,
  calcCurrentShares,
  calcValueHistory,
  calcStartingValueHistory,
  utils,
};
