/**
 * Characterization tests for the file-system image service.
 * Boundaries mocked: `fs/promises` (disk) and `sharp` (image processing).
 * No real files are read or written.
 */
const fsMock = {
  access: jest.fn() as jest.Mock,
  mkdir: jest.fn() as jest.Mock,
  rm: jest.fn() as jest.Mock,
  unlink: jest.fn() as jest.Mock,
  readdir: jest.fn() as jest.Mock,
  stat: jest.fn() as jest.Mock,
}

jest.mock('fs/promises', () => ({ __esModule: true, default: fsMock, ...fsMock }))

const toFile = jest.fn()
const metadata = jest.fn()
const sharpInstance = {
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toFile: (...a: unknown[]) => toFile(...a),
  metadata: (...a: unknown[]) => metadata(...a),
}
const sharpFactory = jest.fn(() => sharpInstance)
jest.mock('sharp', () => ({ __esModule: true, default: (...a: unknown[]) => sharpFactory(...a) }))

import {
  saveImage,
  saveImages,
  deleteEntityImages,
  deleteImage,
  imageExists,
  getImageInfo,
  cleanupOrphanedImages,
} from '../image.service'

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  jest.clearAllMocks()
  fsMock.access.mockResolvedValue(undefined)
  fsMock.mkdir.mockResolvedValue(undefined)
  toFile.mockResolvedValue(undefined)
})

describe('saveImage', () => {
  it('generates the three sizes and returns their public URLs', async () => {
    const urls = await saveImage('data:image/png;base64,QQ==', {
      entityType: 'products',
      entityId: 'prod-1',
      imageIndex: 0,
    })

    // thumb + medium + full = 3 sharp pipelines.
    expect(sharpFactory).toHaveBeenCalledTimes(3)
    expect(toFile).toHaveBeenCalledTimes(3)

    expect(urls.thumb).toMatch(/^\/uploads\/products\/prod-1\/img_0_thumb_.*\.webp$/)
    expect(urls.medium).toMatch(/^\/uploads\/products\/prod-1\/img_0_medium_.*\.webp$/)
    expect(urls.full).toMatch(/^\/uploads\/products\/prod-1\/img_0_full_.*\.webp$/)
  })

  it('creates the entity directory when it does not exist yet', async () => {
    fsMock.access.mockRejectedValueOnce(new Error('ENOENT'))

    await saveImage('QQ==', { entityType: 'users', entityId: 'u1' })

    expect(fsMock.mkdir).toHaveBeenCalledTimes(1)
    expect(fsMock.mkdir.mock.calls[0][1]).toEqual({ recursive: true })
  })

  it('uses homepage high-quality sizing for homepage entities', async () => {
    await saveImage('QQ==', { entityType: 'homepage', entityId: 'hero' })

    // full size uses 3840x2880 at quality 98 for homepage.
    expect(sharpInstance.resize).toHaveBeenCalledWith(3840, 2880, expect.any(Object))
    expect(sharpInstance.webp).toHaveBeenCalledWith({ quality: 98 })
  })
})

describe('saveImages', () => {
  it('saves each image with an incrementing index', async () => {
    const results = await saveImages(['a==', 'b=='], {
      entityType: 'products',
      entityId: 'prod-1',
    })

    expect(results).toHaveLength(2)
    expect(results[0].thumb).toMatch(/img_0_thumb/)
    expect(results[1].thumb).toMatch(/img_1_thumb/)
  })
})

describe('deleteEntityImages', () => {
  it('recursively removes the entity directory', async () => {
    fsMock.rm.mockResolvedValue(undefined)

    await deleteEntityImages('products', 'prod-1')

    expect(fsMock.rm).toHaveBeenCalledTimes(1)
    expect(fsMock.rm.mock.calls[0][1]).toEqual({ recursive: true, force: true })
  })

  it('never throws even when removal fails', async () => {
    fsMock.rm.mockRejectedValue(new Error('EACCES'))
    await expect(deleteEntityImages('products', 'prod-1')).resolves.toBeUndefined()
  })
})

describe('deleteImage', () => {
  it('deletes every size sharing the image prefix', async () => {
    fsMock.readdir.mockResolvedValue([
      'img_0_thumb_1.webp',
      'img_0_medium_1.webp',
      'img_0_full_1.webp',
      'img_1_thumb_1.webp',
    ])
    fsMock.unlink.mockResolvedValue(undefined)

    await deleteImage('/uploads/products/prod-1/img_0_thumb_1.webp')

    // Only the three img_0_* files are unlinked, not img_1_*.
    expect(fsMock.unlink).toHaveBeenCalledTimes(3)
  })
})

describe('imageExists', () => {
  it('returns true when the file is accessible', async () => {
    fsMock.access.mockResolvedValue(undefined)
    await expect(imageExists('/uploads/products/p/x.webp')).resolves.toBe(true)
  })

  it('returns false when access rejects', async () => {
    fsMock.access.mockRejectedValue(new Error('ENOENT'))
    await expect(imageExists('/uploads/products/p/x.webp')).resolves.toBe(false)
  })
})

describe('getImageInfo', () => {
  it('returns size and dimensions when the file exists', async () => {
    fsMock.stat.mockResolvedValue({ size: 1234 })
    metadata.mockResolvedValue({ width: 800, height: 600 })

    const info = await getImageInfo('/uploads/products/p/x.webp')

    expect(info).toEqual({ exists: true, size: 1234, width: 800, height: 600 })
  })

  it('returns exists:false when the file is missing', async () => {
    fsMock.stat.mockRejectedValue(new Error('ENOENT'))
    await expect(getImageInfo('/uploads/products/p/x.webp')).resolves.toEqual({ exists: false })
  })
})

describe('cleanupOrphanedImages', () => {
  it('deletes directories whose entity id is no longer present', async () => {
    fsMock.readdir.mockResolvedValue(['keep-1', 'orphan-1', 'orphan-2'])
    fsMock.rm.mockResolvedValue(undefined)

    const deleted = await cleanupOrphanedImages('products', ['keep-1'])

    expect(deleted).toBe(2)
    expect(fsMock.rm).toHaveBeenCalledTimes(2)
  })

  it('returns 0 when reading the directory fails', async () => {
    fsMock.readdir.mockRejectedValue(new Error('ENOENT'))
    await expect(cleanupOrphanedImages('products', [])).resolves.toBe(0)
  })
})
