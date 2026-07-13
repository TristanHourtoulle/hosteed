/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { useProductWizardForm } from '../useProductWizardForm'
import { DEFAULT_FORM_DATA, type ProductFormData } from '@/types/product-form'
import { createEmptyRoomType } from '../../utils/roomTypeHelpers'
import type { RoomTypeFormData } from '../../types/roomType'

function validRoomType(): RoomTypeFormData {
  return {
    ...createEmptyRoomType(),
    name: 'Double',
    quantity: '2',
    capacity: '2',
    basePrice: '80',
    priceMGA: '400000',
    beds: [
      { bedType: 'SIMPLE', count: 0 },
      { bedType: 'DOUBLE', count: 1 },
      { bedType: 'KING', count: 0 },
      { bedType: 'GRAND_KING', count: 0 },
    ],
  }
}

function formData(overrides: Partial<ProductFormData>): ProductFormData {
  return { ...DEFAULT_FORM_DATA, roomTypes: [], ...overrides } as ProductFormData
}

describe('useProductWizardForm — hotel branch at step 2', () => {
  it('fails when a hotel has no room types', () => {
    const { result } = renderHook(() => useProductWizardForm(true))
    act(() => result.current.goToStep(2))
    let outcome!: { isValid: boolean }
    act(() => {
      outcome = result.current.validateCurrentStep(formData({ isHotel: true, roomTypes: [] }))
    })
    expect(outcome.isValid).toBe(false)
    expect(result.current.hasFieldError('roomTypes')).toBe(true)
  })

  it('passes with one valid room type', () => {
    const { result } = renderHook(() => useProductWizardForm(true))
    act(() => result.current.goToStep(2))
    let outcome!: { isValid: boolean }
    act(() => {
      outcome = result.current.validateCurrentStep(
        formData({ isHotel: true, roomTypes: [validRoomType()] })
      )
    })
    expect(outcome.isValid).toBe(true)
  })

  it('surfaces a per-card field path for an invalid price', () => {
    const { result } = renderHook(() => useProductWizardForm(true))
    act(() => result.current.goToStep(2))
    act(() => {
      result.current.validateCurrentStep(
        formData({ isHotel: true, roomTypes: [validRoomType(), { ...validRoomType(), basePrice: '' }] })
      )
    })
    expect(result.current.hasFieldError('roomTypes.1.basePrice')).toBe(true)
  })
})

describe('useProductWizardForm — non-hotel branch at step 2', () => {
  it('validates basePrice and priceMGA', () => {
    const { result } = renderHook(() => useProductWizardForm(false))
    act(() => result.current.goToStep(2))
    let outcome!: { isValid: boolean }
    act(() => {
      outcome = result.current.validateCurrentStep(
        formData({ isHotel: false, basePrice: '', priceMGA: '' })
      )
    })
    expect(outcome.isValid).toBe(false)
    expect(result.current.hasFieldError('basePrice')).toBe(true)
    expect(result.current.hasFieldError('priceMGA')).toBe(true)
  })
})
