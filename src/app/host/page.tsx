'use client'
import { Suspense } from 'react'
import { useProductSearchOptimized } from '@/hooks/useProductSearchOptimized'
import ModernSearchBar from '@/components/ui/modernSearchBar'
import SearchHeader from '@/components/host/SearchHeader'
import SearchResults from '@/components/host/SearchResults'
import LoadingState from '@/components/host/LoadingState'
import ErrorState from '@/components/host/ErrorState'

function HostPageContent() {
  const {
    products,
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
  } = useProductSearchOptimized()

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
              productsCount={products.length}
            />
          </div>

          <SearchResults
            products={products}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
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
