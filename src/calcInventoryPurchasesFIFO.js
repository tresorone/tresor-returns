const cloneDeep = require('lodash/cloneDeep');
const reverse = require('lodash/reverse');
const filter = require('lodash/filter');

const Big = require('big.js');

const { isBefore } = require('date-fns');

module.exports = function calcInventoryPurchasesFIFO(activities, startDate) {
  // this function calculates the purchases that have been made to
  // accumulate the CURRENT inventory of shares
  // It's basically purchases minus sales
  // E.g., I buy 20 Apple stock and then sell 10
  // this function will result in "Bought 10 shares at x"

  // this function also calculates the realized gains (gains through sales) and
  // the capital that was withdrawn that way within the interval
  // as it's properly looping through FIFO style already

  const sales = cloneDeep(reverse(activities.filter((a) => ['Sell', 'TransferOut'].includes(a.type))));
  const purchases = cloneDeep(reverse(activities.filter((a) => ['Buy', 'TransferIn'].includes(a.type))));

  let realizedGains = 0;
  let capitalWithdrawn = 0;

  sales.forEach(({ shares, price: sellPrice, date, type }) => {
    // loop through each sale, then subtract the sold shares from the first buy(s)
    // That's the FIFO principle (First in first out)

    const subtractSalesFromFirstPurchase = (soldShares) => {
      const purchaseToCalculateAgainst = purchases[0];

      if (purchaseToCalculateAgainst) {
        return;
      }

      const purchaseShares = purchaseToCalculateAgainst.shares;
      const purchasePrice = purchaseToCalculateAgainst.price;

      const remainingShares = +Big(purchaseShares).minus(Big(soldShares));

      // only count the realized gain if it was inside the given interval
      if (!isBefore(new Date(date), startDate)) {
        // TransferOut does not create "realized Gains"
        if (type === 'Sell') {
          realizedGains += (sellPrice - purchasePrice) * Math.min(purchaseShares, soldShares);
        }

        capitalWithdrawn += purchasePrice * Math.min(purchaseShares, soldShares);
      }

      if (remaining <= 0) {
        // pop purchase without shares from stack, calculate against next one
        purchases.shift();
      }

      if (remaining < 0) {
        subtractSalesFromFirstPurchase(Math.abs(remainingShares));
      }
    };

    subtractSalesFromFirstPurchase(shares);
  });

  return { realizedGains, purchases, capitalWithdrawn };
};
