/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { StepServices } from '../StepServices'
import { DEFAULT_FORM_DATA, type ProductFormData } from '@/types/product-form'

const noop = jest.fn()
const asyncNoop = jest.fn(async () => {})

function renderStep(isHotel: boolean) {
  const formData: ProductFormData = { ...DEFAULT_FORM_DATA, roomTypes: [] }
  render(
    <StepServices
      formData={formData}
      setFormData={noop}
      isHotel={isHotel}
      equipments={[{ id: 'eq1', name: 'Climatisation' }]}
      meals={[{ id: 'm1', name: 'Petit-déjeuner' }]}
      securities={[{ id: 'sec1', name: 'Extincteur' }]}
      services={[{ id: 'srv1', name: 'Navette' }]}
      includedServices={[{ id: 's1', name: 'Wifi', description: null, icon: null, userId: null }]}
      extras={[
        {
          id: 'e1',
          name: 'Parking',
          description: null,
          priceEUR: 10,
          priceMGA: 50000,
          type: 'PerDay' as never,
          userId: null,
        },
      ]}
      highlights={[{ id: 'h1', name: 'Vue mer', description: null, icon: null, userId: null }]}
      refreshIncludedServices={asyncNoop}
      refreshExtras={asyncNoop}
      refreshHighlights={asyncNoop}
    />
  )
}

describe('StepServices', () => {
  it('shows every section for non-hotels', () => {
    renderStep(false)
    expect(screen.getByText('Services de restauration')).toBeInTheDocument()
    expect(screen.getByText('Services inclus')).toBeInTheDocument()
    expect(screen.getByText('Options payantes')).toBeInTheDocument()
    expect(screen.getByText('Points forts')).toBeInTheDocument()
    expect(screen.getByText('Équipements disponibles')).toBeInTheDocument()
  })

  it('hides meals, included services and extras for hotels', () => {
    renderStep(true)
    expect(screen.queryByText('Services de restauration')).not.toBeInTheDocument()
    expect(screen.queryByText('Services inclus')).not.toBeInTheDocument()
    expect(screen.queryByText('Options payantes')).not.toBeInTheDocument()
  })

  it('keeps establishment-level sections for hotels', () => {
    renderStep(true)
    expect(screen.getByText('Équipements disponibles')).toBeInTheDocument()
    expect(screen.getByText('Équipements de sécurité')).toBeInTheDocument()
    expect(screen.getByText('Services additionnels')).toBeInTheDocument()
    expect(screen.getByText('Points forts')).toBeInTheDocument()
  })
})
