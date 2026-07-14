/**
 * Homepage settings (singleton row). Prisma is mocked at the boundary (node env).
 * We verify get/update/getOrCreate flows including the "update existing vs create
 * new" branch and the null-on-error behavior.
 */

const homepageSettings = {
  findFirst: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { homepageSettings },
}))

import {
  getHomepageSettings,
  updateHomepageSettings,
  getOrCreateHomepageSettings,
} from '../homepageSettings.service'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getHomepageSettings', () => {
  it('returns the singleton settings row', async () => {
    homepageSettings.findFirst.mockResolvedValue({ id: 's1' })
    expect(await getHomepageSettings()).toEqual({ id: 's1' })
  })

  it('returns null on error', async () => {
    homepageSettings.findFirst.mockRejectedValue(new Error('boom'))
    expect(await getHomepageSettings()).toBeNull()
  })
})

describe('updateHomepageSettings', () => {
  it('updates the existing row when one exists', async () => {
    homepageSettings.findFirst.mockResolvedValue({ id: 's1' })
    homepageSettings.update.mockResolvedValue({ id: 's1', heroBackgroundImage: 'img' })

    const result = await updateHomepageSettings({ heroBackgroundImage: 'img' })

    expect(result).toEqual({ id: 's1', heroBackgroundImage: 'img' })
    expect(homepageSettings.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { heroBackgroundImage: 'img' },
    })
    expect(homepageSettings.create).not.toHaveBeenCalled()
  })

  it('creates a new row when none exists', async () => {
    homepageSettings.findFirst.mockResolvedValue(null)
    homepageSettings.create.mockResolvedValue({ id: 'new', howItWorksImage: 'x' })

    const result = await updateHomepageSettings({ howItWorksImage: 'x' })

    expect(result).toEqual({ id: 'new', howItWorksImage: 'x' })
    expect(homepageSettings.create).toHaveBeenCalledWith({ data: { howItWorksImage: 'x' } })
  })

  it('returns null on error', async () => {
    homepageSettings.findFirst.mockRejectedValue(new Error('boom'))
    expect(await updateHomepageSettings({})).toBeNull()
  })
})

describe('getOrCreateHomepageSettings', () => {
  it('returns the existing row without creating', async () => {
    homepageSettings.findFirst.mockResolvedValue({ id: 's1' })

    const result = await getOrCreateHomepageSettings()

    expect(result).toEqual({ id: 's1' })
    expect(homepageSettings.create).not.toHaveBeenCalled()
  })

  it('creates a default row when none exists', async () => {
    homepageSettings.findFirst.mockResolvedValue(null)
    homepageSettings.create.mockResolvedValue({ id: 'new' })

    const result = await getOrCreateHomepageSettings()

    expect(result).toEqual({ id: 'new' })
    expect(homepageSettings.create).toHaveBeenCalledWith({ data: {} })
  })

  it('re-throws on error (does not swallow)', async () => {
    homepageSettings.findFirst.mockRejectedValue(new Error('boom'))
    await expect(getOrCreateHomepageSettings()).rejects.toThrow('boom')
  })
})
