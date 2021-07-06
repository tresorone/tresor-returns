const cloneDeep = require('lodash/cloneDeep');
const orderBy = require('lodash/orderBy');

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

  // order asc - it's necessary for a FIFO loop. earliest/oldest activity is first in the array. Latest/newest is last
  const orderedActivities = orderBy(cloneDeep(activities), (a) => new Date(a.date), 'asc');

  const sales = orderedActivities.filter((a) => ['Sell', 'TransferOut'].includes(a.type));
  const purchases = orderedActivities.filter((a) => ['Buy', 'TransferIn'].includes(a.type));

  let realized = 0;
  let capitalWidthdrawnViaSales = 0;
  let capitalWithdrawnViaTransferOut = 0;

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
          // realized gains through sales
          realized += (price - buyPrice) * Math.min(buyShares, sellShares);

          capitalWidthdrawnViaSales += buyPrice * Math.min(buyShares, sellShares);
        } else if (type === 'TransferOut') {
          capitalWithdrawnViaTransferOut += buyPrice * Math.min(buyShares, sellShares);
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

  const capitalWithdrawn = capitalWidthdrawnViaSales + capitalWithdrawnViaTransferOut;

  return {
    realizedGains: realized,
    purchases,
    capitalWithdrawn,
    transferOutAmount: capitalWithdrawnViaTransferOut, // deprecated
    capitalWithdrawnViaTransferOut,
    sellAmount: capitalWidthdrawnViaSales, // deprecated
    capitalWidthdrawnViaSales,
  };
};
