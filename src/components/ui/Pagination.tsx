'use client'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPrevNext?: boolean
  showNumbers?: boolean
  maxVisiblePages?: number
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPrevNext = true,
  showNumbers = true,
  maxVisiblePages = 5,
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - delta)
    let end = Math.min(totalPages, currentPage + delta)

    // Adjust if we're near the beginning
    if (currentPage - delta < 1) {
      end = Math.min(totalPages, end + (delta - currentPage + 1))
    }

    // Adjust if we're near the end
    if (currentPage + delta > totalPages) {
      start = Math.max(1, start - (currentPage + delta - totalPages))
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()
  const showStartEllipsis = visiblePages[0] > 2
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* Previous Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>
      )}

      {showNumbers && (
        <>
          {/* First page */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(1)}
                className="min-w-[40px]"
              >
                1
              </Button>
              {showStartEllipsis && (
                <div className="flex items-center justify-center min-w-[40px] h-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="min-w-[40px]"
            >
              {page}
            </Button>
          ))}

          {/* Last page */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {showEndEllipsis && (
                <div className="flex items-center justify-center min-w-[40px] h-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="min-w-[40px]"
              >
                {totalPages}
              </Button>
            </>
          )}
        </>
      )}

      {/* Next Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Compact version for mobile/small spaces
export function PaginationCompact({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: Omit<PaginationProps, 'showPrevNext' | 'showNumbers' | 'maxVisiblePages'>) {
  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </Button>

      <span className="text-sm text-gray-600">
        Page {currentPage} sur {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1"
      >
        Suivant
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Info component showing current results
export function PaginationInfo({
  currentPage,
  itemsPerPage,
  totalItems,
  className = ''
}: {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  className?: string
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalItems === 0) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        Aucun résultat trouvé
      </div>
    )
  }

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      Affichage de {startItem} à {endItem} sur {totalItems} résultats
    </div>
  )
}