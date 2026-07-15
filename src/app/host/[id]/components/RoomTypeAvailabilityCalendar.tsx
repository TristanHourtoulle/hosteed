'use client'

import { Calendar } from '@/components/ui/shadcnui/calendar'
import { isDateBlocked } from '../lib/roomTypeSelection'

interface RoomTypeAvailabilityCalendarProps {
  /** Blocked ranges (ISO strings, as returned by the availability API). */
  blockedRanges: Array<{ startDate: string; endDate: string }>
  className?: string
}

/**
 * Read-only month view highlighting the dates on which a room type is closed
 * (past dates and {@link isDateBlocked} ranges are disabled). Purely
 * informational — date selection happens at the booking-card level.
 */
export function RoomTypeAvailabilityCalendar({
  blockedRanges,
  className = '',
}: RoomTypeAvailabilityCalendarProps) {
  const ranges = blockedRanges.map(r => ({
    startDate: new Date(r.startDate),
    endDate: new Date(r.endDate),
  }))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Calendar
      mode='single'
      selected={undefined}
      disabled={date => date < today || isDateBlocked(date, ranges)}
      className={`rounded-lg border ${className}`}
    />
  )
}
