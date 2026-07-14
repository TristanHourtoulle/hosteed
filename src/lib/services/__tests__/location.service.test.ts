/**
 * location.service is mostly pure address logic (Google Places component
 * extraction, best-effort parsing of free-text addresses, and display
 * formatting). The only side-effecting method — getLocationComponentsFromPlaceId
 * — is exercised with the Google suggestion client mocked at the boundary.
 */

const getPlaceDetailsMock = jest.fn()

jest.mock('../GoogleSuggestion.service', () => ({
  googleSuggestionService: {
    getPlaceDetails: (...args: unknown[]) => getPlaceDetailsMock(...args),
  },
}))

import locationService, {
  parseAddress,
  formatProductLocation,
  formatFullProductLocation,
  buildAddress,
  getLocationComponents,
} from '../location.service'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('parseExistingAddress', () => {
  it('returns Madagascar defaults for an empty address', () => {
    expect(parseAddress('')).toEqual({
      formattedAddress: '',
      neighborhood: null,
      city: null,
      region: null,
      country: 'Madagascar',
    })
  })

  it('treats a single part as the city', () => {
    const parsed = parseAddress('Antananarivo')
    expect(parsed.city).toBe('Antananarivo')
    expect(parsed.country).toBe('Madagascar')
  })

  it('parses "City, Country" when the last part is a known country', () => {
    const parsed = parseAddress('Nosy Be, Madagascar')
    expect(parsed.city).toBe('Nosy Be')
    expect(parsed.country).toBe('Madagascar')
    expect(parsed.neighborhood).toBeNull()
  })

  it('parses "Neighborhood, City" when the last part is not a country', () => {
    const parsed = parseAddress('Ambondrona, Nosy Be')
    expect(parsed.neighborhood).toBe('Ambondrona')
    expect(parsed.city).toBe('Nosy Be')
  })

  it('parses "Neighborhood, City, Country" (3 parts, ends with country)', () => {
    const parsed = parseAddress('Ambondrona, Nosy Be, Madagascar')
    expect(parsed.neighborhood).toBe('Ambondrona')
    expect(parsed.city).toBe('Nosy Be')
    expect(parsed.country).toBe('Madagascar')
  })

  it('parses a 5-part address with a known Madagascar region', () => {
    const parsed = parseAddress('Rue X, Ambondrona, Nosy Be, Diana, Madagascar')
    expect(parsed.country).toBe('Madagascar')
    expect(parsed.region).toBe('Diana')
    expect(parsed.city).toBe('Nosy Be')
    expect(parsed.neighborhood).toBe('Ambondrona')
  })
})

describe('formatShortLocation / formatProductLocation', () => {
  it('prefers "Neighborhood, City" when both structured fields exist', () => {
    expect(formatProductLocation({ neighborhood: 'Ambondrona', city: 'Nosy Be' })).toBe(
      'Ambondrona, Nosy Be'
    )
  })

  it('falls back to "City, Country" without a neighborhood', () => {
    expect(formatProductLocation({ city: 'Nosy Be', country: 'Madagascar' })).toBe(
      'Nosy Be, Madagascar'
    )
  })

  it('returns a fallback string when nothing is available', () => {
    expect(formatProductLocation({})).toBe('Localisation non spécifiée')
  })

  it('parses a legacy free-text address when structured fields are absent', () => {
    expect(formatProductLocation({ address: 'Ambondrona, Nosy Be, Madagascar' })).toBe(
      'Ambondrona, Nosy Be'
    )
  })
})

describe('formatFullProductLocation', () => {
  it('includes neighborhood, city and country', () => {
    expect(
      formatFullProductLocation({
        neighborhood: 'Ambondrona',
        city: 'Nosy Be',
        country: 'Madagascar',
      })
    ).toBe('Ambondrona, Nosy Be, Madagascar')
  })
})

describe('buildAddress', () => {
  it('joins the present components with commas', () => {
    expect(
      buildAddress({ neighborhood: 'A', city: 'B', region: 'C', country: 'D' })
    ).toBe('A, B, C, D')
  })

  it('skips missing components', () => {
    expect(buildAddress({ city: 'B', country: 'D' })).toBe('B, D')
  })
})

describe('extractComponentsFromPlaceDetails', () => {
  it('maps Google address components into structured fields with coordinates', () => {
    const result = locationService.extractComponentsFromPlaceDetails({
      place_id: 'gp1',
      formatted_address: 'Ambondrona, Nosy Be, Madagascar',
      geometry: { location: { lat: -13.4, lng: 48.2 } },
      address_components: [
        { long_name: 'Ambondrona', short_name: 'Ambondrona', types: ['neighborhood'] },
        { long_name: 'Nosy Be', short_name: 'Nosy Be', types: ['locality'] },
        { long_name: 'Diana', short_name: 'Diana', types: ['administrative_area_level_1'] },
        { long_name: 'Madagascar', short_name: 'MG', types: ['country'] },
      ],
    } as never)

    expect(result.neighborhood).toBe('Ambondrona')
    expect(result.city).toBe('Nosy Be')
    expect(result.region).toBe('Diana')
    expect(result.country).toBe('Madagascar')
    expect(result.coordinates).toEqual({ latitude: -13.4, longitude: 48.2 })
    expect(result.googlePlaceId).toBe('gp1')
  })

  it('defaults country to Madagascar and coordinates to null when absent', () => {
    const result = locationService.extractComponentsFromPlaceDetails({
      place_id: 'gp2',
      formatted_address: 'Somewhere',
      address_components: [],
    } as never)

    expect(result.country).toBe('Madagascar')
    expect(result.coordinates).toBeNull()
  })
})

describe('getLocationComponents (getLocationComponentsFromPlaceId)', () => {
  it('returns null when the place lookup returns nothing', async () => {
    getPlaceDetailsMock.mockResolvedValue(null)
    expect(await getLocationComponents('gp1')).toBeNull()
  })

  it('returns structured components when the lookup succeeds', async () => {
    getPlaceDetailsMock.mockResolvedValue({
      place_id: 'gp1',
      formatted_address: 'Nosy Be, Madagascar',
      address_components: [
        { long_name: 'Nosy Be', short_name: 'Nosy Be', types: ['locality'] },
        { long_name: 'Madagascar', short_name: 'MG', types: ['country'] },
      ],
    })

    const result = await getLocationComponents('gp1', 'session-token')

    expect(result?.city).toBe('Nosy Be')
    expect(getPlaceDetailsMock).toHaveBeenCalledWith(
      expect.objectContaining({ placeId: 'gp1', sessionToken: 'session-token' })
    )
  })

  it('returns null when the lookup throws', async () => {
    getPlaceDetailsMock.mockRejectedValue(new Error('google down'))
    expect(await getLocationComponents('gp1')).toBeNull()
  })
})
