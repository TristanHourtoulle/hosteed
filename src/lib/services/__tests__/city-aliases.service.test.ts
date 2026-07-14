/**
 * city-aliases.service is pure in-memory logic: it resolves French/colonial and
 * alternate spellings of Malagasy cities to a canonical name so a search matches
 * regardless of the variant typed. No I/O — tests exercise the alias maps and
 * the Prisma-condition generator directly.
 */

import cityAliasesService, {
  getCityAliases,
  getCitySearchConditions,
  areSameCity,
} from '../city-aliases.service'

describe('getAliases / getCityAliases', () => {
  it('returns all lowercased variants for a known canonical city', () => {
    const aliases = getCityAliases('Antananarivo')
    expect(aliases).toContain('antananarivo')
    expect(aliases).toContain('tananarive')
    expect(aliases).toContain('tana')
  })

  it('resolves from an alias back to the full variant list', () => {
    const aliases = getCityAliases('Tananarive')
    expect(aliases).toContain('antananarivo')
    expect(aliases).toContain('tana')
  })

  it('returns just the normalized term for an unknown city', () => {
    expect(getCityAliases('Paris')).toEqual(['paris'])
  })

  it('trims and lowercases the input', () => {
    expect(getCityAliases('  Majunga  ')).toContain('mahajanga')
  })
})

describe('getCanonicalName', () => {
  it('maps an alias to its canonical (lowercased) name', () => {
    expect(cityAliasesService.getCanonicalName('Tananarive')).toBe('antananarivo')
    expect(cityAliasesService.getCanonicalName('Majunga')).toBe('mahajanga')
  })

  it('returns the normalized input when the city is unknown', () => {
    expect(cityAliasesService.getCanonicalName('Paris')).toBe('paris')
  })
})

describe('areSameCity', () => {
  it('returns true for two aliases of the same city', () => {
    expect(areSameCity('Antananarivo', 'Tananarive')).toBe(true)
    expect(areSameCity('Diego-Suarez', 'Antsiranana')).toBe(true)
  })

  it('returns false for different cities', () => {
    expect(areSameCity('Antananarivo', 'Majunga')).toBe(false)
  })
})

describe('extractCityFromLocation', () => {
  it('returns the first comma-separated segment', () => {
    expect(
      cityAliasesService.extractCityFromLocation('Tananarive, Analamanga, Madagascar')
    ).toBe('Tananarive')
  })

  it('returns the whole string when there is no comma', () => {
    expect(cityAliasesService.extractCityFromLocation('Nosy Be')).toBe('Nosy Be')
  })
})

describe('generatePrismaOrConditions / getCitySearchConditions', () => {
  it('produces one insensitive contains condition per alias × field', () => {
    const conditions = getCitySearchConditions('Antananarivo', ['city', 'address'])
    const aliasCount = getCityAliases('Antananarivo').length

    expect(conditions).toHaveLength(aliasCount * 2)
    expect(conditions[0]).toEqual({
      city: { contains: expect.any(String), mode: 'insensitive' },
    })
  })

  it('defaults to the standard field set when none is provided', () => {
    const conditions = getCitySearchConditions('Paris')
    // one alias ("paris") × 4 default fields
    expect(conditions).toHaveLength(4)
  })
})

describe('addAlias', () => {
  it('registers a new alias that then resolves to the canonical name', () => {
    cityAliasesService.addAlias('Antananarivo', 'TestVilleAlias')

    expect(cityAliasesService.getCanonicalName('TestVilleAlias')).toBe('antananarivo')
    expect(getCityAliases('Antananarivo')).toContain('testvillealias')
  })
})
