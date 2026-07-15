/**
 * check-room-availability — date-parameter validation edge cases.
 * Complements `route.test.ts` (missing productId, success, calendar-only, 500).
 * The availability service is mocked; date validation happens in the handler.
 */
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

describe('GET /api/check-room-availability — date validation', () => {
  it('400 (VAL_002) on an unparseable date', async () => {
    const res = await GET(
      makeRequest({ productId: 'p1', arrival: 'not-a-date', leaving: 'also-bad' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VAL_002')
    expect(getHotelRoomTypeAvailabilityMock).not.toHaveBeenCalled()
  })

  it('400 (VAL_003) when leaving is not after arrival', async () => {
    const res = await GET(
      makeRequest({ productId: 'p1', arrival: '2026-08-05', leaving: '2026-08-01' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe('VAL_003')
    expect(getHotelRoomTypeAvailabilityMock).not.toHaveBeenCalled()
  })

  it('passes parsed Date objects to the service when both dates are valid', async () => {
    getHotelRoomTypeAvailabilityMock.mockResolvedValue([])

    const res = await GET(
      makeRequest({ productId: 'p1', arrival: '2026-08-01', leaving: '2026-08-03' })
    )

    expect(res.status).toBe(200)
    const [pid, arrival, leaving] = getHotelRoomTypeAvailabilityMock.mock.calls[0]
    expect(pid).toBe('p1')
    expect(arrival).toBeInstanceOf(Date)
    expect(leaving).toBeInstanceOf(Date)
  })
})
