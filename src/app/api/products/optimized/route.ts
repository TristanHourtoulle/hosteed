import { NextRequest, NextResponse } from 'next/server'
import { findAllProductsPaginated } from '@/lib/services/product.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const search = searchParams.get('search') || ''
    const typeRentId = searchParams.get('typeRentId') || ''
    const location = searchParams.get('location') || ''
    const featured = searchParams.get('featured') === 'true'
    const popular = searchParams.get('popular') === 'true'
    const recent = searchParams.get('recent') === 'true'
    const promo = searchParams.get('promo') === 'true'
    const certifiedOnly = searchParams.get('certifiedOnly') === 'true'
    const autoAcceptOnly = searchParams.get('autoAcceptOnly') === 'true'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minPeople = searchParams.get('minPeople')
    const maxPeople = searchParams.get('maxPeople')

    // Use the existing paginated service
    const result = await findAllProductsPaginated({
      page,
      limit,
      imageMode: 'lightweight', // Only 1 image for performance
      includeLightweight: true,
    })

    if (!result) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Apply additional filters that aren't in the basic service
    let filteredProducts = result.products

    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase()
      filteredProducts = filteredProducts.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.address.toLowerCase().includes(searchTerm) ||
          (product.description && product.description.toLowerCase().includes(searchTerm))
      )
    }

    // Apply location filter
    if (location.trim()) {
      const locationTerm = location.toLowerCase()
      filteredProducts = filteredProducts.filter(product =>
        product.address.toLowerCase().includes(locationTerm)
      )
    }

    // Apply type filter
    if (typeRentId) {
      filteredProducts = filteredProducts.filter(product => product.typeId === typeRentId)
    }

    // Apply certification filter
    if (certifiedOnly) {
      filteredProducts = filteredProducts.filter(product => product.certified === true)
    }

    // Apply auto-accept filter
    if (autoAcceptOnly) {
      filteredProducts = filteredProducts.filter(product => product.autoAccept === true)
    }

    // Apply price filters
    if (minPrice) {
      const min = parseFloat(minPrice)
      filteredProducts = filteredProducts.filter(product => parseFloat(product.basePrice) >= min)
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice)
      filteredProducts = filteredProducts.filter(product => parseFloat(product.basePrice) <= max)
    }

    // Apply people filters
    if (minPeople) {
      const min = parseInt(minPeople)
      filteredProducts = filteredProducts.filter(
        product => product.maxPeople && Number(product.maxPeople) >= min
      )
    }

    if (maxPeople) {
      const max = parseInt(maxPeople)
      filteredProducts = filteredProducts.filter(
        product => product.maxPeople && Number(product.maxPeople) <= max
      )
    }

    // Apply special filters
    if (featured) {
      filteredProducts = filteredProducts.filter(
        product => product.certified || product.validate === 'Approve'
      )
    }

    if (popular) {
      // Sort by a popularity score (could be enhanced with real metrics)
      filteredProducts = filteredProducts.sort((a, b) => {
        const aScore = (a.equipments?.length || 0) + (a.servicesList?.length || 0)
        const bScore = (b.equipments?.length || 0) + (b.servicesList?.length || 0)
        return bScore - aScore
      })
    }

    if (recent) {
      filteredProducts = filteredProducts.sort((a, b) => b.id.localeCompare(a.id))
    }

    if (promo) {
      filteredProducts = filteredProducts.filter(product => {
        const price = parseFloat(product.basePrice)
        return price < 100 // Simple promo filter
      })
    }

    // Convert BigInt fields to numbers for JSON serialization
    const products = filteredProducts.map(product => ({
      ...product,
      room: 'room' in product && product.room ? Number(product.room) : null,
      bathroom: 'bathroom' in product && product.bathroom ? Number(product.bathroom) : null,
      personMax: 'personMax' in product && product.personMax ? Number(product.personMax) : null,
      maxPeople: 'maxPeople' in product && product.maxPeople ? Number(product.maxPeople) : null,
      minPeople: 'minPeople' in product && product.minPeople ? Number(product.minPeople) : null,
      priceUSD: 'priceUSD' in product && product.priceUSD ? Number(product.priceUSD) : null,
      priceMGA: 'priceMGA' in product && product.priceMGA ? Number(product.priceMGA) : null,
    }))

    // Update pagination to reflect filtered results
    const totalFilteredItems =
      search.trim() ||
      location.trim() ||
      typeRentId ||
      certifiedOnly ||
      autoAcceptOnly ||
      minPrice ||
      maxPrice ||
      minPeople ||
      maxPeople ||
      featured ||
      popular ||
      recent ||
      promo
        ? filteredProducts.length
        : result.pagination.total

    const response = {
      products,
      pagination: {
        currentPage: result.pagination.page,
        totalPages: totalFilteredItems
          ? Math.ceil(totalFilteredItems / limit)
          : result.pagination.totalPages,
        itemsPerPage: result.pagination.limit,
        totalItems: totalFilteredItems,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev,
      },
    }

    // Set cache headers for optimized performance
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=60') // 60 seconds cache

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Error in optimized products API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
