/**
 * Re-export shim. The room-type DB shapes moved to `@/types/room-type-db` when
 * the host edit page started mapping the same data (TRI-1028); the admin
 * validation views keep importing them from here unchanged.
 */
export type {
  RoomTypeBedView,
  RoomTypeImageView,
  RoomTypePromotionView,
  RoomTypeSpecialPriceView,
  RoomTypeWithRelations,
} from '@/types/room-type-db'
