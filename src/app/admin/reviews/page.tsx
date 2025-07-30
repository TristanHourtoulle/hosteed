'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Search, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ReviewCard } from './components/ReviewCard'
import { findAllReviews, approveReview, deleteReview } from '@/lib/services/reviews.service'

interface Review {
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
  rentRelation: {
    user: {
      name: string | null
      email: string
    }
    product: {
      name: string
    }
  }
}

export default function ReviewsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [adminReviews, setAdminReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await findAllReviews()
        if (data) {
          setReviews(data as Review[])
        }

        // Charger aussi les avis administratifs
        if (session?.user?.roles && ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
          const adminResponse = await fetch('/api/admin/reviews')
          if (adminResponse.ok) {
            const adminData = await adminResponse.json()
            if (adminData.success) {
              setAdminReviews(adminData.reviews)
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des avis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [session])

  const handleApprove = async (id: string) => {
    try {
      await approveReview(id)
      setReviews(reviews.map(review => (review.id === id ? { ...review, approved: true } : review)))
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await deleteReview(id)
      setReviews(reviews.filter(review => review.id !== id))
    } catch (error) {
      console.error('Erreur lors du rejet:', error)
    }
  }

  const filteredReviews = reviews.filter(
    review =>
      review.rentRelation.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.rentRelation.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingReviews = filteredReviews.filter(r => !r.approved)
  const approvedReviews = filteredReviews.filter(r => r.approved)

  if (loading) {
    return (
      <div className='p-8 max-w-5xl mx-auto'>
        <div className='space-y-8'>
          {[1, 2, 3].map(i => (
            <div key={i} className='animate-pulse'>
              <div className='h-40 bg-gray-200 rounded-lg'></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='p-8 max-w-5xl mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='flex flex-col gap-4 mb-8'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-2xl font-bold'>Gestion des Avis</h1>
              <p className='text-gray-500'>Gérez les avis des utilisateurs</p>
            </div>
            <Button
              onClick={() => router.push('/admin/reviews/create')}
              className='flex items-center gap-2'
              disabled={
                !session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)
              }
            >
              <Plus className='w-4 h-4' />
              Créer un avis administratif
            </Button>
          </div>

          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
            <Input
              className='pl-9'
              placeholder='Rechercher par nom, hébergement ou contenu...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue='pending' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='pending'>En attente ({pendingReviews.length})</TabsTrigger>
            <TabsTrigger value='approved'>Approuvés ({approvedReviews.length})</TabsTrigger>
            {session?.user?.roles && ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles) && (
              <TabsTrigger value='admin'>Avis administratifs ({adminReviews.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value='pending' className='space-y-6'>
            {pendingReviews.length === 0 ? (
              <p className='text-center py-8 text-gray-500'>Aucun avis en attente</p>
            ) : (
              pendingReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={{
                    id: review.id,
                    rating: review.grade,
                    comment: review.text,
                    createdAt: review.publishDate,
                    status: 'pending',
                    user: review.rentRelation.user as { name: string; email: string },
                    product: review.rentRelation.product as { name: string },
                  }}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value='approved' className='space-y-6'>
            {approvedReviews.length === 0 ? (
              <p className='text-center py-8 text-gray-500'>Aucun avis approuvé</p>
            ) : (
              approvedReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={{
                    id: review.id,
                    rating: review.grade,
                    comment: review.text,
                    createdAt: review.publishDate,
                    status: 'approved',
                    user: review.rentRelation.user as { name: string; email: string },
                    product: review.rentRelation.product as { name: string },
                  }}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </TabsContent>

          {session?.user?.roles && ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles) && (
            <TabsContent value='admin' className='space-y-6'>
              {adminReviews.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-gray-500 mb-4'>Aucun avis administratif créé</p>
                  <Button
                    onClick={() => router.push('/admin/reviews/create')}
                    className='flex items-center gap-2 mx-auto'
                  >
                    <Plus className='w-4 h-4' />
                    Créer le premier avis administratif
                  </Button>
                </div>
              ) : (
                adminReviews.map(review => (
                  <ReviewCard
                    key={review.id}
                    review={{
                      id: review.id,
                      rating: review.grade,
                      comment: review.text,
                      createdAt: review.publishDate,
                      status: 'approved',
                      user: review.rentRelation.user as { name: string; email: string },
                      product: review.rentRelation.product as { name: string },
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  )
}
