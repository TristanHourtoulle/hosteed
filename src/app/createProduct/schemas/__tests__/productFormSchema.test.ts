import {
  getStepLabels,
  getTotalSteps,
  ESTABLISHMENT_STEP_LABELS,
  HOTEL_STEP_LABELS,
  STEP_LABELS,
  TOTAL_STEPS,
} from '../productFormSchema'

describe('dynamic step configuration', () => {
  it('uses "Types de chambres" at index 2 for hotels', () => {
    expect(getStepLabels(true)[2]).toBe('Types de chambres')
  })

  it('uses "Tarification" at index 2 for non-hotels', () => {
    expect(getStepLabels(false)[2]).toBe('Tarification')
  })

  it('both flows have 5 steps', () => {
    expect(getTotalSteps(true)).toBe(5)
    expect(getTotalSteps(false)).toBe(5)
  })

  it('keeps the non-hotel labels as the backward-compatible defaults', () => {
    expect(STEP_LABELS).toEqual([...ESTABLISHMENT_STEP_LABELS])
    expect(TOTAL_STEPS).toBe(5)
  })

  it('differs only at index 2 between flows', () => {
    HOTEL_STEP_LABELS.forEach((label, index) => {
      if (index === 2) {
        expect(label).not.toBe(ESTABLISHMENT_STEP_LABELS[index])
      } else {
        expect(label).toBe(ESTABLISHMENT_STEP_LABELS[index])
      }
    })
  })
})
