import { MAX_IMAGES } from '@/app/createProduct/utils/constants'
import {
  MAX_LISTING_PHOTOS,
  PhotoBudgetExceededError,
  assertPhotoBudget,
  computePhotoBudget,
} from '../photoBudget'

describe('computePhotoBudget', () => {
  it('returns the full budget as remaining for an empty listing', () => {
    expect(computePhotoBudget({ establishmentCount: 0, roomTypeCounts: [] })).toEqual({
      used: 0,
      remaining: 20,
      max: 20,
    })
  })

  it('leaves no room for room-type photos when the establishment already holds the cap', () => {
    expect(computePhotoBudget({ establishmentCount: 20, roomTypeCounts: [] })).toEqual({
      used: 20,
      remaining: 0,
      max: 20,
    })
  })

  it('counts establishment and room-type photos against the same global cap', () => {
    expect(computePhotoBudget({ establishmentCount: 17, roomTypeCounts: [1, 2] })).toEqual({
      used: 20,
      remaining: 0,
      max: 20,
    })
  })

  it('sums every room type into the used total', () => {
    expect(computePhotoBudget({ establishmentCount: 8, roomTypeCounts: [2, 2] })).toEqual({
      used: 12,
      remaining: 8,
      max: 20,
    })
  })

  it('clamps remaining at zero when the listing is over budget', () => {
    expect(computePhotoBudget({ establishmentCount: 18, roomTypeCounts: [5] })).toEqual({
      used: 23,
      remaining: 0,
      max: 20,
    })
  })
})

describe('assertPhotoBudget', () => {
  it('does not throw when the listing sits exactly on the cap', () => {
    expect(() => assertPhotoBudget({ establishmentCount: 15, roomTypeCounts: [3, 2] })).not.toThrow()
  })

  it('throws PhotoBudgetExceededError carrying used and max when over budget', () => {
    expect.assertions(4)

    try {
      assertPhotoBudget({ establishmentCount: 19, roomTypeCounts: [3] })
    } catch (error) {
      expect(error).toBeInstanceOf(PhotoBudgetExceededError)
      const budgetError = error as PhotoBudgetExceededError
      expect(budgetError.used).toBe(22)
      expect(budgetError.max).toBe(20)
      expect(budgetError.message).toContain('22')
    }
  })

  it('names the error so it survives serialization boundaries', () => {
    expect(() => assertPhotoBudget({ establishmentCount: 21, roomTypeCounts: [] })).toThrow(
      PhotoBudgetExceededError
    )
  })
})

describe('MAX_IMAGES', () => {
  it('is derived from the single global photo cap', () => {
    expect(MAX_IMAGES).toBe(MAX_LISTING_PHOTOS)
    expect(MAX_LISTING_PHOTOS).toBe(20)
  })
})
