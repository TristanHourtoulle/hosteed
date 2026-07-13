const getHotelRoomTypeAvailabilityMock = jest.fn()
jest.mock('@/lib/services/rent-availability.service', () => ({
  getHotelRoomTypeAvailability: (...a: unknown[]) => getHotelRoomTypeAvailabilityMock(...a),
}))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }))

import { GET } from '../route'

function makeRequest(query: Record<string, string>) {
  const params = new URLSearchParams(query)
  return new Request(`http://localhost/api/check-room-availability?${params}`)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/check-room-availability', () => {
  it('returns 400 when productId is missing', async () => {
    const res = await GET(makeRequest({ arrival: '2026-08-01', leaving: '2026-08-03' }))
    expect(res.status).toBe(400)
    expect(getHotelRoomTypeAvailabilityMock).not.toHaveBeenCalled()
  })

  it('returns per-type availability array on success', async () => {
    getHotelRoomTypeAvailabilityMock.mockResolvedValue([
      { roomTypeId: 'rt-1', availableQuantity: 2, available: true },
      { roomTypeId: 'rt-2', availableQuantity: 0, available: false },
    ])

    const res = await GET(
      makeRequest({ productId: 'p1', arrival: '2026-08-01', leaving: '2026-08-03' })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body[0].available).toBe(true)
    expect(body[1].available).toBe(false)
  })

  it('fetches calendar-only availability when dates are omitted', async () => {
    getHotelRoomTypeAvailabilityMock.mockResolvedValue([])

    const res = await GET(makeRequest({ productId: 'p1' }))

    expect(res.status).toBe(200)
    expect(getHotelRoomTypeAvailabilityMock).toHaveBeenCalledWith('p1', null, null)
  })

  it('returns 500 when the availability service throws', async () => {
    getHotelRoomTypeAvailabilityMock.mockRejectedValue(new Error('db down'))

    const res = await GET(
      makeRequest({ productId: 'p1', arrival: '2026-08-01', leaving: '2026-08-03' })
    )
    expect(res.status).toBe(500)
  })
})
