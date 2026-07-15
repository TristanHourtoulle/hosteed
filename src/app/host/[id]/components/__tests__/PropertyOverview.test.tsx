/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import PropertyOverview from '../PropertyOverview'
import type { RoomTypeView } from '@/types/roomType'
import type { User } from '@prisma/client'

const owner = { id: 'u-1', name: 'Cathy', image: null } as unknown as User

function makeRoomType(over: Partial<RoomTypeView> = {}): RoomTypeView {
  return {
    id: 'rt-1',
    name: 'Chambre Double',
    quantity: 4,
    capacity: 2,
    surface: 20,
    smoking: false,
    basePrice: '120',
    priceMGA: '600000',
    position: 0,
    beds: [{ bedType: 'DOUBLE', count: 1 }],
    ...over,
  }
}

describe('PropertyOverview', () => {
  it('derives hotel stats from room types and hides product-level stats', () => {
    render(
      <PropertyOverview
        isHotel
        product={{
          id: 'p-1',
          name: 'Hôtel Test',
          owner,
          maxPeople: 24,
          room: 12,
          bathroom: 10,
          sizeRoom: 80,
          roomTypes: [
            makeRoomType({ id: 'rt-1', quantity: 4, capacity: 2 }),
            makeRoomType({ id: 'rt-2', quantity: 2, capacity: 4 }),
          ],
        }}
      />
    )

    expect(screen.getByText(/2 types de chambres/)).toBeInTheDocument()
    expect(screen.getByText(/^6 chambres$/)).toBeInTheDocument()
    expect(screen.getByText(/Jusqu'à 4 voyageurs par chambre/)).toBeInTheDocument()

    expect(screen.queryByText(/24 voyageurs/)).not.toBeInTheDocument()
    expect(screen.queryByText(/12 chambres/)).not.toBeInTheDocument()
    expect(screen.queryByText(/10 salles de bain/)).not.toBeInTheDocument()
    expect(screen.queryByText(/80m²/)).not.toBeInTheDocument()
  })

  it('keeps product-level stats for non-hotel products', () => {
    render(
      <PropertyOverview
        isHotel={false}
        product={{
          id: 'p-2',
          name: 'Villa Test',
          owner,
          maxPeople: 4,
          room: 2,
          bathroom: 1,
          sizeRoom: 80,
        }}
      />
    )

    expect(screen.getByText(/4 voyageurs/)).toBeInTheDocument()
    expect(screen.getByText(/^2 chambres$/)).toBeInTheDocument()
    expect(screen.getByText(/1 salle de bain/)).toBeInTheDocument()
    expect(screen.getByText(/80m²/)).toBeInTheDocument()
  })

  it('uses singular wording for a single room type with one room and one guest', () => {
    render(
      <PropertyOverview
        isHotel
        product={{
          id: 'p-3',
          name: 'Petit Hôtel',
          owner,
          roomTypes: [makeRoomType({ quantity: 1, capacity: 1 })],
        }}
      />
    )

    expect(screen.getByText(/1 type de chambre/)).toBeInTheDocument()
    expect(screen.getByText(/^1 chambre$/)).toBeInTheDocument()
    expect(screen.getByText(/Jusqu'à 1 voyageur par chambre/)).toBeInTheDocument()
  })
})
