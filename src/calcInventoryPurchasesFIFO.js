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

  let realized = 0;
  let capitalWithdrawn = 0;
  let transferOutAmount = 0;

  sales.forEach(({ shares, price, date, type }) => {
    // loop through each sale, then subtract the sold shares from the first buy(s)
    // That's the FIFO principle (First in first out)

    const subtract = (j, sellShares) => {
      if (!purchases[j]) {
        return;
      }

      const buyShares = purchases[j].shares;
      const buyPrice = purchases[j].price;

      const remaining = +Big(buyShares).minus(Big(sellShares));
      purchases[j].shares = remaining;

      // only count the realized gain if it was inside the given interval
      if (!isBefore(new Date(date), startDate)) {
        // TransferOut does not create "realized Gains"
        if (type === 'Sell') {
          realized += (price - buyPrice) * Math.min(buyShares, sellShares);
          capitalWithdrawn += buyPrice * Math.min(buyShares, sellShares);
        } else if (type === 'TransferOut') {
          transferOutAmount += buyPrice * Math.min(buyShares, sellShares);
        }
      }

      if (remaining === 0) {
        purchases.shift();
      } else if (remaining < 0) {
        purchases.shift();
        subtract(j, Math.abs(remaining));
      }
    };

    subtract(0, shares);
  });

  return { realizedGains: realized, purchases, capitalWithdrawn, transferOutAmount };
};
