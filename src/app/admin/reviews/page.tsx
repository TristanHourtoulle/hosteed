import { approveReview, deleteReview, findAllWaitingReview } from '@/lib/services/reviews.service'

export default async function AdminReviews() {
  const reviews = await findAllWaitingReview()
  const pendingReviews = reviews?.filter(review => !review.approved) || []

  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>Gestion des Avis</h1>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>
            Avis en attente de validation
          </h2>

          {pendingReviews.length === 0 ? (
            <p className='text-gray-600'>Aucun avis en attente de validation</p>
          ) : (
            <div className='space-y-4'>
              {pendingReviews.map(review => (
                <div key={review.id} className='border rounded-lg p-4'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='text-lg font-medium text-gray-900'>{review.title}</h3>
                      <p className='text-gray-600 mt-2'>{review.text}</p>
                      <div className='mt-2'>
                        <span className='text-sm text-gray-500'>Note: {review.grade}/5</span>
                        <span className='text-sm text-gray-500 ml-4'>
                          Date de visite: {new Date(review.visitDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <form
                        action={async () => {
                          'use server'
                          await approveReview(review.id)
                        }}
                      >
                        <button
                          type='submit'
                          className='bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors'
                        >
                          Valider
                        </button>
                      </form>
                      <form
                        action={async () => {
                          'use server'
                          await deleteReview(review.id)
                        }}
                      >
                        <button
                          type='submit'
                          className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors'
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
