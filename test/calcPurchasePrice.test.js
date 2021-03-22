const calcPurchasePrice = require('../src/calcPurchasePrice')

describe('calcPurchasePrice', () => {
  
  test('should calculate single purchases', () => {
    const result = calcPurchasePrice([
      {
        shares: 100,
        price: 1.1
      }
    ])

    expect(result.purchaseValue).toBeCloseTo(110)
    expect(result.purchasePrice).toBeCloseTo(1.1)
  })

  test('should add whole shares', () => {
    const result = calcPurchasePrice([
      {
        shares: 1,
        price: 69.12
      },
      {
        shares: 1,
        price: 42
      }
    ])
    
    expect(result.purchaseValue).toBeCloseTo(111.12)
    expect(result.purchasePrice).toBeCloseTo(55.56)
  })

  test('should add fractional shares', () => {
    const result = calcPurchasePrice([
      {
        shares: 1.337,
        price: 69.12
      },
      {
        shares: 0.420,
        price: 42
      }
    ])
    
    expect(result.purchaseValue).toBeCloseTo(110.053)
    expect(result.purchasePrice).toBeCloseTo(62.637)
  })
  
  test('should return 0 if purchases are undefined', () => {
    const result = calcPurchasePrice()

    expect(result.purchaseValue).toBeCloseTo(0)
    expect(result.purchasePrice).toBeCloseTo(0)
  })
  
  test('should return 0 if there are no purchases', () => {
    const result = calcPurchasePrice([])

    expect(result.purchaseValue).toBeCloseTo(0)
    expect(result.purchasePrice).toBeCloseTo(0)
  })

})
