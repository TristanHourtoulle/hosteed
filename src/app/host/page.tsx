'use client'
import { Suspense } from 'react'
import { useProductSearchPaginated } from '@/hooks/useProductSearchPaginated'
import ModernSearchBar from '@/components/ui/modernSearchBar'
import SearchHeader from '@/components/host/SearchHeader'
import SearchResults from '@/components/host/SearchResults'
import LoadingState from '@/components/host/LoadingState'
import ErrorState from '@/components/host/ErrorState'
import { SponsoredSection, SpecialOffersSection } from '@/components/homepage'

function HostPageContent() {
  const {
    products,
    pagination,
    loading,
    error,
    location,
    selectedType,
    typeRent,
    featured,
    popular,
    recent,
    promo,
    filters,
    guests,
    securities,
    meals,
    equipments,
    services,
    handleModernSearch,
    resetFilters,
    setFilters,
    goToPage,
  } = useProductSearchPaginated()

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  const hasActiveFilters = Boolean(
    selectedType || location || featured || popular || recent || promo
  )

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-3 sm:px-4 lg:px-8'>
        {/* Modern Search Bar */}
        <div className='py-4 sm:py-6 lg:py-8'>
          <ModernSearchBar
            onSearch={handleModernSearch}
            initialLocation={location}
            initialCheckIn={filters.arrivingDate}
            initialCheckOut={filters.leavingDate}
            initialGuests={guests}
            filters={filters}
            onFiltersChange={setFilters}
            securities={securities}
            meals={meals}
            equipments={equipments}
            services={services}
            typeRooms={[]}
          />
        </div>

        {/* Sponsored and Special Offers - Only show when no filters are active */}
        {!hasActiveFilters && (
          <>
            <SponsoredSection />
            <SpecialOffersSection />
          </>
        )}

        {/* Results Section */}
        <div className='pb-8'>
          <div className='mb-4 sm:mb-6'>
            <SearchHeader
              location={location}
              featured={featured}
              popular={popular}
              recent={recent}
              promo={promo}
              selectedType={selectedType}
              typeRent={typeRent}
              productsCount={pagination?.total || products.length}
            />
          </div>

          <SearchResults
            products={products}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            pagination={pagination}
            onPageChange={goToPage}
          />
        </div>
      </div>
    </div>
  )
}

export default function HostPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HostPageContent />
    </Suspense>
  )
}
