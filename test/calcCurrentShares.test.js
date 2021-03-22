const calcCurrentShares = require('../src/calcCurrentShares')

describe('calcCurrentShares', () => {
  
  test('should return 0 if there are no activities', () => {
    const result = calcCurrentShares([])

    expect(result).toBe(0)
  })

  test('should add buys and transfer-ins', () => {
    const result = calcCurrentShares([
      {
        type: 'Buy',
        shares: 0.5
      },
      {
        type: 'TransferIn',
        shares: 2
      },
      {
        type: 'TransferIn',
        shares: 2.007
      },
      {
        type: 'Buy',
        shares: 1337
      }
    ])

    expect(result).toBeCloseTo(1341.507)
  })

  // https://github.com/tresorone/tresor-returns/issues/11
  test('should subtract a sell', () => {
    const result = calcCurrentShares([
      {
        type: 'Buy',
        shares: 1
      },
      {
        type: 'Sell',
        shares: 2
      },
      {
        type: 'Buy',
        shares: 2
      }
    ])

    expect(result).toBe(1)
  })

})
