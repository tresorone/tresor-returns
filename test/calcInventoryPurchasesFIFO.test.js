const calcInventoryPurchasesFIFO = require('../src/calcInventoryPurchasesFIFO')

describe('calcInventoryPurchasesFIFO', () => {
  
  test('should leave last purchase', () => {
    const result = calcInventoryPurchasesFIFO([
      {
        type: 'Buy',
        date: '2020-04-01',
        shares: 10,
        price: 12
      },
      {
        type: 'Buy',
        date: '2020-04-02',
        shares: 10,
        price: 10
      },
      {
        type: 'Sell',
        date: '2020-05-12',
        shares: 15,
        price: 17
      },
      {
        type: 'Buy',
        date: '2020-05-21',
        shares: 15,
        price: 13
      },
      {
        type: 'Sell',
        date: '2020-07-03',
        shares: 15,
        price: 19
      }
    ], new Date('2020-01-01'))

    expect(result.realizedGains).toBe(190)
    expect(result.purchases).toEqual([
      { type: 'Buy', date: '2020-05-21', shares: 5, price: 13 }
    ])
    expect(result.capitalWithdrawn).toBe(350)
  })
})
