import { Star } from 'lucide-react'

interface Reviews {
  id: string
  title: string
  text: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  visitDate: Date
  publishDate: Date
  approved: boolean
}

interface PropertyReviewsProps {
  reviews: Reviews[]
  globalGrade: number
}

export default function PropertyReviews({ reviews, globalGrade }: PropertyReviewsProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <div className='flex items-center gap-4 mb-6'>
        <Star className='h-6 w-6 fill-current text-yellow-400' />
        <h3 className='text-lg font-semibold text-gray-900'>
          {globalGrade.toFixed(1)} · {reviews.length} avis
        </h3>
      </div>

      {/* Rating Breakdown */}
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-8'>
        {[
          {
            label: 'Accueil',
            value: reviews.reduce((acc, r) => acc + r.welcomeGrade, 0) / reviews.length,
          },
          {
            label: 'Personnel',
            value: reviews.reduce((acc, r) => acc + r.staff, 0) / reviews.length,
          },
          {
            label: 'Confort',
            value: reviews.reduce((acc, r) => acc + r.comfort, 0) / reviews.length,
          },
          {
            label: 'Équipement',
            value: reviews.reduce((acc, r) => acc + r.equipment, 0) / reviews.length,
          },
          {
            label: 'Nettoyage',
            value: reviews.reduce((acc, r) => acc + r.cleaning, 0) / reviews.length,
          },
        ].map(item => (
          <div key={item.label} className='text-center'>
            <div className='text-lg font-semibold text-gray-900'>{item.value.toFixed(1)}</div>
            <div className='text-sm text-gray-600'>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Individual Reviews */}
      <div className='space-y-6'>
        {reviews.slice(0, 3).map(review => (
          <div key={review.id} className='border-b border-gray-100 pb-6 last:border-b-0'>
            <div className='flex items-start gap-4'>
              <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium'>
                U
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <h4 className='font-medium text-gray-900'>{review.title}</h4>
                  <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4 fill-current text-yellow-400' />
                    <span className='text-sm text-gray-600'>{review.grade}</span>
                  </div>
                </div>
                <p className='text-gray-700 text-sm leading-relaxed'>{review.text}</p>
                <p className='text-gray-500 text-xs mt-2'>
                  {new Date(review.publishDate).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
