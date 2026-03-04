'use client'

import { useState, useEffect } from 'react'
import { motion, Variants } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import {
  Search,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
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
      image: string | null
      profilePicture: string | null
      profilePictureBase64: string | null
    }
    product: {
      name: string
    }
  }
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function ReviewsPage() {
  const router = useRouter()
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const [searchTerm, setSearchTerm] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [adminReviews, setAdminReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await findAllReviews()
        let allReviews = data ? (data as Review[]) : []
        let fetchedAdminReviews: Review[] = []

        if (
          isAuthenticated &&
          session?.user?.roles &&
          ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)
        ) {
          const adminResponse = await fetch('/api/admin/reviews')
          if (adminResponse.ok) {
            const adminData = await adminResponse.json()
            if (adminData.success) {
              fetchedAdminReviews = adminData.reviews
              setAdminReviews(fetchedAdminReviews)
            }
          }
        }

        // Exclude admin reviews from the regular list to avoid duplicates
        if (fetchedAdminReviews.length > 0) {
          const adminIds = new Set(fetchedAdminReviews.map((r: Review) => r.id))
          allReviews = allReviews.filter(r => !adminIds.has(r.id))
        }

        setReviews(allReviews)
      } catch {
        toast.error('Erreur lors du chargement des avis')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchReviews()
    }
  }, [isAuthenticated, session])

  const handleApprove = async (id: string) => {
    try {
      await approveReview(id)
      setReviews(reviews.map(review => (review.id === id ? { ...review, approved: true } : review)))
      toast.success('Avis approuvé avec succès')
    } catch {
      toast.error("Erreur lors de l'approbation de l'avis")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await deleteReview(id)
      setReviews(reviews.filter(review => review.id !== id))
      toast.success('Avis rejeté et supprimé')
    } catch {
      toast.error('Erreur lors du rejet de l\'avis')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setReviews(prev => prev.filter(review => review.id !== id))
        setAdminReviews(prev => prev.filter(review => review.id !== id))
        toast.success('Avis supprimé avec succès')
      } else {
        toast.error('Impossible de supprimer cet avis')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
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

  const filteredAdminReviews = adminReviews.filter(
    review =>
      review.rentRelation.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.rentRelation.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Unfiltered counts for stat cards
  const pendingCount = reviews.filter(r => !r.approved).length
  const approvedCount = reviews.filter(r => r.approved).length
  const adminCount = adminReviews.length

  const isAdminOrManager =
    session?.user?.roles && ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  function mapReviewToCard(review: Review, status: 'pending' | 'approved') {
    return {
      id: review.id,
      title: review.title,
      rating: review.grade,
      comment: review.text,
      createdAt: review.publishDate,
      status,
      welcomeGrade: review.welcomeGrade,
      staff: review.staff,
      comfort: review.comfort,
      equipment: review.equipment,
      cleaning: review.cleaning,
      user: review.rentRelation.user as { name: string; email: string; image: string | null; profilePicture: string | null; profilePictureBase64: string | null },
      product: review.rentRelation.product as { name: string },
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 space-y-8'>
        <motion.div
          initial='hidden'
          animate='visible'
          variants={containerVariants}
          className='space-y-8'
        >
          {/* Header */}
          <motion.div variants={itemVariants} className='text-center space-y-4'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mx-auto'>
              <MessageSquare className='w-8 h-8 text-white' />
            </div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent'>
              Gestion des Avis
            </h1>
            <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
              Modérez et gérez les avis de la plateforme
            </p>
          </motion.div>

          {/* Stat cards */}
          <motion.div variants={itemVariants} className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card className='border-0 shadow-sm bg-white/70 backdrop-blur-sm'>
              <CardContent className='p-5 flex items-center gap-4'>
                <div className='p-3 rounded-full bg-amber-100'>
                  <Clock className='h-5 w-5 text-amber-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-900'>{pendingCount}</p>
                  <p className='text-sm text-gray-500'>En attente</p>
                </div>
              </CardContent>
            </Card>
            <Card className='border-0 shadow-sm bg-white/70 backdrop-blur-sm'>
              <CardContent className='p-5 flex items-center gap-4'>
                <div className='p-3 rounded-full bg-green-100'>
                  <CheckCircle2 className='h-5 w-5 text-green-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-900'>{approvedCount}</p>
                  <p className='text-sm text-gray-500'>Approuvés</p>
                </div>
              </CardContent>
            </Card>
            {isAdminOrManager && (
              <Card className='border-0 shadow-sm bg-white/70 backdrop-blur-sm'>
                <CardContent className='p-5 flex items-center gap-4'>
                  <div className='p-3 rounded-full bg-purple-100'>
                    <ShieldCheck className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold text-gray-900'>{adminCount}</p>
                    <p className='text-sm text-gray-500'>Avis administratifs</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Toolbar */}
          <motion.div
            variants={itemVariants}
            className='bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0'
          >
            <div className='flex items-center gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  className='pl-10 border-0 bg-gray-50 focus:bg-white rounded-xl'
                  placeholder='Rechercher par nom, hébergement ou contenu...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                onClick={() => router.push('/admin/reviews/create')}
                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md'
                disabled={!isAdminOrManager}
              >
                <Plus className='w-4 h-4 mr-2' />
                Créer un avis
              </Button>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue='pending' className='space-y-6'>
              <TabsList className='bg-white/80 backdrop-blur-sm rounded-xl p-1'>
                <TabsTrigger value='pending' className='rounded-lg'>
                  En attente
                  <Badge variant='secondary' className='ml-2 bg-amber-100 text-amber-800'>
                    {pendingReviews.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='approved' className='rounded-lg'>
                  Approuvés
                  <Badge variant='secondary' className='ml-2 bg-green-100 text-green-800'>
                    {approvedReviews.length}
                  </Badge>
                </TabsTrigger>
                {isAdminOrManager && (
                  <TabsTrigger value='admin' className='rounded-lg'>
                    Avis administratifs
                    <Badge variant='secondary' className='ml-2 bg-purple-100 text-purple-800'>
                      {filteredAdminReviews.length}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value='pending'>
                {pendingReviews.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='text-center py-16'
                  >
                    <Clock className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun avis en attente</h3>
                    <p className='text-gray-500'>Tous les avis ont été traités</p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial='hidden'
                    animate='visible'
                    className='space-y-4'
                  >
                    {pendingReviews.map(review => (
                      <motion.div key={review.id} variants={itemVariants}>
                        <ReviewCard
                          review={mapReviewToCard(review, 'pending')}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onDelete={handleDelete}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value='approved'>
                {approvedReviews.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='text-center py-16'
                  >
                    <CheckCircle2 className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun avis approuvé</h3>
                    <p className='text-gray-500'>Les avis approuvés apparaîtront ici</p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial='hidden'
                    animate='visible'
                    className='space-y-4'
                  >
                    {approvedReviews.map(review => (
                      <motion.div key={review.id} variants={itemVariants}>
                        <ReviewCard
                          review={mapReviewToCard(review, 'approved')}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onDelete={handleDelete}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </TabsContent>

              {isAdminOrManager && (
                <TabsContent value='admin'>
                  {filteredAdminReviews.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='text-center py-16'
                    >
                      <ShieldCheck className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Aucun avis administratif
                      </h3>
                      <p className='text-gray-500 mb-6'>
                        Créez des avis fictifs pour vos hébergements
                      </p>
                      <Button
                        onClick={() => router.push('/admin/reviews/create')}
                        className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        Créer le premier avis
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial='hidden'
                      animate='visible'
                      className='space-y-4'
                    >
                      {filteredAdminReviews.map(review => (
                        <motion.div key={review.id} variants={itemVariants}>
                          <ReviewCard
                            review={mapReviewToCard(review, 'approved')}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onDelete={handleDelete}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
