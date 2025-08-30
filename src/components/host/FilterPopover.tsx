'use client'
import { useState } from 'react'
import { Filter, Users, Home, Euro, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/shadcnui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcnui/popover'

interface FilterState {
  selectedSecurities: string[]
  selectedMeals: string[]
  selectedEquipments: string[]
  selectedServices: string[]
  selectedTypeRooms: string[]
  searchRadius: number
  arrivingDate: string
  leavingDate: string
  // New filters based on Prisma schema
  minPrice: string
  maxPrice: string
  minPeople: string
  maxPeople: string
  minRooms: string
  maxRooms: string
  minBathrooms: string
  maxBathrooms: string
  sizeMin: string
  sizeMax: string
  autoAcceptOnly: boolean
  certifiedOnly: boolean
  contractRequired: boolean
}

interface FilterPopoverProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  securities: Array<{ id: string; name: string }>
  meals: Array<{ id: string; name: string }>
  equipments: Array<{ id: string; name: string }>
  services: Array<{ id: string; name: string }>
  typeRooms: Array<{ id: string; name: string }>
}

export default function FilterPopover({
  filters,
  onFiltersChange,
  securities: _securities,
  meals: _meals,
  equipments: _equipments,
  services: _services,
  typeRooms: _typeRooms,
}: FilterPopoverProps) {
  // Suppress unused variable warnings for props that are passed but not used in current implementation  
  void _typeRooms
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const [isOpen, setIsOpen] = useState(false)
  
  // States pour contrôler l'affichage des sections déroulables
  const [expandedSections, setExpandedSections] = useState({
    equipments: false,
    services: false,
    meals: false,
    securities: false,
  })

  const handleCheckboxChange = (filterType: keyof FilterState, value: string, checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...(prev[filterType] as string[]), value]
        : (prev[filterType] as string[]).filter(id => id !== value),
    }))
  }

  const handleInputChange = (field: keyof FilterState, value: string | boolean | number) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const resetFilters = () => {
    const emptyFilters: FilterState = {
      selectedSecurities: [],
      selectedMeals: [],
      selectedEquipments: [],
      selectedServices: [],
      selectedTypeRooms: [],
      searchRadius: 50,
      arrivingDate: '',
      leavingDate: '',
      minPrice: '',
      maxPrice: '',
      minPeople: '',
      maxPeople: '',
      minRooms: '',
      maxRooms: '',
      minBathrooms: '',
      maxBathrooms: '',
      sizeMin: '',
      sizeMax: '',
      autoAcceptOnly: false,
      certifiedOnly: false,
      contractRequired: false,
    }
    setLocalFilters(emptyFilters)
  }

  // Count active filters for badge
  const activeFiltersCount = [
    localFilters.selectedSecurities.length,
    localFilters.selectedMeals.length,
    localFilters.selectedEquipments.length,
    localFilters.selectedServices.length,
    localFilters.minPrice ? 1 : 0,
    localFilters.maxPrice ? 1 : 0,
    localFilters.minPeople ? 1 : 0,
    localFilters.maxPeople ? 1 : 0,
    localFilters.minRooms ? 1 : 0,
    localFilters.maxRooms ? 1 : 0,
    localFilters.minBathrooms ? 1 : 0,
    localFilters.maxBathrooms ? 1 : 0,
    localFilters.sizeMin ? 1 : 0,
    localFilters.sizeMax ? 1 : 0,
    localFilters.autoAcceptOnly ? 1 : 0,
    localFilters.certifiedOnly ? 1 : 0,
    localFilters.contractRequired ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='w-12 h-12 hover:bg-blue-50 hover:text-blue-600 hover:cursor-pointer flex items-center justify-center border border-blue-600 text-blue-600 relative rounded-xl md:rounded-full font-medium flex-shrink-0'
        >
          <Filter className='h-5 w-5' />
          {activeFiltersCount > 0 && (
            <span className='absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center'>
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='w-[95vw] max-w-[800px] max-h-[80vh] overflow-y-auto p-0'
        align='center'
        side='bottom'
        avoidCollisions={true}
        sideOffset={8}
      >
        <div className='sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 rounded-t-lg'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Filter className='h-5 w-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Filtres de recherche</h3>
            </div>
            {activeFiltersCount > 0 && (
              <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium'>
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className='p-3 sm:p-4 space-y-4 sm:space-y-6'>
          {/* Prix */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center space-x-2 text-base'>
                <Euro className='h-4 w-4 text-green-600' />
                <span>Prix par nuit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Prix minimum
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='0 €'
                    min='0'
                    value={localFilters.minPrice}
                    onChange={e => handleInputChange('minPrice', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Prix maximum
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='1000 €'
                    min='0'
                    value={localFilters.maxPrice}
                    onChange={e => handleInputChange('maxPrice', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacité */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center space-x-2 text-base'>
                <Users className='h-4 w-4 text-purple-600' />
                <span>Capacité</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Minimum de personnes
                  </label>
                  <input
                    type='number'
                    min="1"
                    placeholder='1'
                    min='0'
                    value={localFilters.minPeople}
                    onChange={e => handleInputChange('minPeople', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Maximum de personnes
                  </label>
                  <input
                    type='number'
                    min="1"
                    placeholder='10'
                    min='0'
                    value={localFilters.maxPeople}
                    onChange={e => handleInputChange('maxPeople', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logement */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center space-x-2 text-base'>
                <Home className='h-4 w-4 text-blue-600' />
                <span>Caractéristiques</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Chambres min.
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='1'
                    min='0'
                    value={localFilters.minRooms}
                    onChange={e => handleInputChange('minRooms', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Chambres max.
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='5'
                    min='0'
                    value={localFilters.maxRooms}
                    onChange={e => handleInputChange('maxRooms', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Salles de bain min.
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='1'
                    min='0'
                    value={localFilters.minBathrooms}
                    onChange={e => handleInputChange('minBathrooms', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Salles de bain max.
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='3'
                    min='0'
                    value={localFilters.maxBathrooms}
                    onChange={e => handleInputChange('maxBathrooms', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Superficie min. (m²)
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='20'
                    min='0'
                    value={localFilters.sizeMin}
                    onChange={e => handleInputChange('sizeMin', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Superficie max. (m²)
                  </label>
                  <input
                    type='number'
                    min="0"
                    placeholder='200'
                    min='0'
                    value={localFilters.sizeMax}
                    onChange={e => handleInputChange('sizeMax', e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-md focus:border-transparent'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options spéciales */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center space-x-2 text-base'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>Options spéciales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={localFilters.autoAcceptOnly}
                    onChange={e => handleInputChange('autoAcceptOnly', e.target.checked)}
                    className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700'>Acceptation automatique</span>
                </label>

                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={localFilters.certifiedOnly}
                    onChange={e => handleInputChange('certifiedOnly', e.target.checked)}
                    className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700'>Hébergements certifiés</span>
                </label>

                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={localFilters.contractRequired}
                    onChange={e => handleInputChange('contractRequired', e.target.checked)}
                    className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700'>Contrat requis</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Équipements */}
          {_equipments.length > 0 && (
            <Card>
              <div 
                className='pb-3 cursor-pointer' 
                onClick={() => toggleSection('equipments')}
              >
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base flex items-center justify-between'>
                    <span>Équipements</span>
                    <div className='flex items-center space-x-2'>
                      {localFilters.selectedEquipments.length > 0 && (
                        <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                          {localFilters.selectedEquipments.length}
                        </span>
                      )}
                      {expandedSections.equipments ? (
                        <ChevronUp className='h-4 w-4 text-gray-500' />
                      ) : (
                        <ChevronDown className='h-4 w-4 text-gray-500' />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              {expandedSections.equipments && (
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto'>
                    {_equipments.map((equipment: { id: string; name: string }) => (
                      <label
                        key={equipment.id}
                        className='flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded'
                      >
                        <input
                          type='checkbox'
                          checked={localFilters.selectedEquipments.includes(equipment.id)}
                          onChange={e =>
                            handleCheckboxChange('selectedEquipments', equipment.id, e.target.checked)
                          }
                          className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0'
                        />
                        <span className='text-sm text-gray-700'>{equipment.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Services */}
          {_services.length > 0 && (
            <Card>
              <div 
                className='pb-3 cursor-pointer' 
                onClick={() => toggleSection('services')}
              >
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base flex items-center justify-between'>
                    <span>Services</span>
                    <div className='flex items-center space-x-2'>
                      {localFilters.selectedServices.length > 0 && (
                        <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                          {localFilters.selectedServices.length}
                        </span>
                      )}
                      {expandedSections.services ? (
                        <ChevronUp className='h-4 w-4 text-gray-500' />
                      ) : (
                        <ChevronDown className='h-4 w-4 text-gray-500' />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              {expandedSections.services && (
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto'>
                    {_services.map((service: { id: string; name: string }) => (
                      <label key={service.id} className='flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded'>
                        <input
                          type='checkbox'
                          checked={localFilters.selectedServices.includes(service.id)}
                          onChange={e =>
                            handleCheckboxChange('selectedServices', service.id, e.target.checked)
                          }
                          className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0'
                        />
                        <span className='text-sm text-gray-700'>{service.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Repas */}
          {_meals.length > 0 && (
            <Card>
              <div 
                className='pb-3 cursor-pointer' 
                onClick={() => toggleSection('meals')}
              >
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base flex items-center justify-between'>
                    <span>Repas</span>
                    <div className='flex items-center space-x-2'>
                      {localFilters.selectedMeals.length > 0 && (
                        <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                          {localFilters.selectedMeals.length}
                        </span>
                      )}
                      {expandedSections.meals ? (
                        <ChevronUp className='h-4 w-4 text-gray-500' />
                      ) : (
                        <ChevronDown className='h-4 w-4 text-gray-500' />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              {expandedSections.meals && (
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto'>
                    {_meals.map((meal: { id: string; name: string }) => (
                      <label key={meal.id} className='flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded'>
                        <input
                          type='checkbox'
                          checked={localFilters.selectedMeals.includes(meal.id)}
                          onChange={e =>
                            handleCheckboxChange('selectedMeals', meal.id, e.target.checked)
                          }
                          className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0'
                        />
                        <span className='text-sm text-gray-700'>{meal.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Sécurité */}
          {_securities.length > 0 && (
            <Card>
              <div 
                className='pb-3 cursor-pointer' 
                onClick={() => toggleSection('securities')}
              >
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base flex items-center justify-between'>
                    <span>Sécurité</span>
                    <div className='flex items-center space-x-2'>
                      {localFilters.selectedSecurities.length > 0 && (
                        <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                          {localFilters.selectedSecurities.length}
                        </span>
                      )}
                      {expandedSections.securities ? (
                        <ChevronUp className='h-4 w-4 text-gray-500' />
                      ) : (
                        <ChevronDown className='h-4 w-4 text-gray-500' />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              {expandedSections.securities && (
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto'>
                    {_securities.map((security: { id: string; name: string }) => (
                      <label key={security.id} className='flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded'>
                        <input
                          type='checkbox'
                          checked={localFilters.selectedSecurities.includes(security.id)}
                          onChange={e =>
                            handleCheckboxChange('selectedSecurities', security.id, e.target.checked)
                          }
                          className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0'
                        />
                        <span className='text-sm text-gray-700'>{security.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className='sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 rounded-b-lg'>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
            <Button
              variant='outline'
              onClick={resetFilters}
              className='w-full sm:flex-1 rounded-full flex items-center justify-center h-10 sm:h-auto'
            >
              Réinitialiser
            </Button>
            <Button onClick={applyFilters} className='w-full sm:flex-1 h-10 sm:h-auto'>
              Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
