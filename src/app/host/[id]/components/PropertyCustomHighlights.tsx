import * as LucideIcons from 'lucide-react'

interface PropertyHighlight {
  id: string
  name: string
  description?: string
  icon?: string
}

interface PropertyCustomHighlightsProps {
  highlights: PropertyHighlight[]
}

export default function PropertyCustomHighlights({ highlights }: PropertyCustomHighlightsProps) {
  if (!highlights || highlights.length === 0) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Points forts</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {highlights.map((highlight) => {
          const IconComponent = highlight.icon
            ? (LucideIcons as unknown as Record<string, React.ElementType>)[highlight.icon] ||
              LucideIcons.Star
            : LucideIcons.Star

          return (
            <div key={highlight.id} className='flex items-start gap-3'>
              <IconComponent className='h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0' />
              <div>
                <span className='text-gray-900 font-medium'>{highlight.name}</span>
                {highlight.description && (
                  <p className='text-sm text-gray-600 mt-1'>{highlight.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}