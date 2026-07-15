'use client'

import { useState, useEffect, use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { useMutationWithCache } from '@/hooks/useMutationWithCache'
import { useBlogAuth } from '@/hooks/useMultiRoleAuth'
import { LazyMarkdownEditor, LazyMarkdownViewer } from '@/components/dynamic/LazyComponents'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { Badge } from '@/components/ui/shadcnui/badge'
import { ArrowLeft, Save, Eye, Edit3, ImagePlus, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'
import SEOFieldsCard, { type SEOData } from '@/components/ui/SEOFieldsCard'

interface Post {
  id: string
  title: string
  content: string
  image?: string
  slug?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
    roles: string
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

interface PageProps {
  params: Promise<{ id: string }>
}

interface UpdatePostPayload {
  title: string
  content: string
  image: string
  seoData: SEOData
}

class PostNotFoundError extends Error {}

export default function EditPostPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { isAuthorized, isLoading, session } = useBlogAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [currentImage, setCurrentImage] = useState<string>('')
  const [seoData, setSeoData] = useState<SEOData>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    slug: '',
  })

  const userId = session?.user?.id
  const userRoles = session?.user?.roles

  const {
    data: post,
    isLoading: isLoadingPost,
    error: postError,
  } = useQuery<Post>({
    queryKey: CACHE_TAGS.adminBlogPost(resolvedParams.id),
    queryFn: async () => {
      const response = await fetch(`/api/posts/${resolvedParams.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new PostNotFoundError('Article non trouvé')
        }
        throw new Error("Erreur lors du chargement de l'article")
      }
      return response.json()
    },
    enabled: !!isAuthorized && !!userId,
    retry: false,
  })

  // Populate the form and enforce ownership once the post is loaded.
  useEffect(() => {
    if (!post) return

    if (userRoles !== 'ADMIN' && post.author.id !== userId) {
      toast.error('Vous ne pouvez modifier que vos propres articles')
      router.push('/admin/blog')
      return
    }

    setTitle(post.title)
    setContent(post.content)
    setCurrentImage(post.image || '')
    setSeoData({
      metaTitle: post.metaTitle || post.title,
      metaDescription: post.metaDescription || '',
      keywords: post.keywords || '',
      slug: post.slug || '',
    })
  }, [post, userRoles, userId, router])

  useEffect(() => {
    if (!postError) return
    if (postError instanceof PostNotFoundError) {
      toast.error('Article non trouvé')
    } else {
      toast.error("Erreur lors du chargement de l'article")
    }
    router.push('/admin/blog')
  }, [postError, router])

  const updatePost = useMutationWithCache<unknown, UpdatePostPayload>({
    mutationFn: async body => {
      const response = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }
      return response.json().catch(() => null)
    },
    invalidateKeys: [CACHE_TAGS.adminBlogPost(resolvedParams.id), CACHE_TAGS.adminBlog()],
    onSuccess: () => {
      toast.success('Article mis à jour avec succès !', {
        description: 'Vos modifications ont été sauvegardées',
      })
      router.push('/admin/blog')
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'article"
      )
    },
  })

  const isSubmitting = updatePost.isPending

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImages([newImages[0]]) // Limit to 1 image
    }
  }

  const removeImage = () => {
    setImages([])
    setCurrentImage('')
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Le titre et le contenu sont requis')
      return
    }

    if (!userId) {
      toast.error('Vous devez être connecté pour modifier un article')
      return
    }

    let imageToUse = currentImage

    if (images.length > 0) {
      // Convert new image to base64
      const reader = new FileReader()
      reader.readAsDataURL(images[0])
      await new Promise(resolve => {
        reader.onload = () => {
          imageToUse = reader.result as string
          resolve(null)
        }
      })
    }

    updatePost.mutate({
      title,
      content,
      image: imageToUse,
      seoData,
    })
  }

  if (isLoading || isLoadingPost || !isAuthorized) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Chargement...</p>
        </motion.div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900'>Article non trouvé</h2>
          <p className='text-gray-600 mt-2'>L&apos;article que vous cherchez n&apos;existe pas.</p>
          <Button asChild className='mt-4'>
            <Link href='/admin/blog'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Retour aux articles
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6'
    >
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Header */}
        <motion.div variants={itemVariants} className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <Button variant='ghost' asChild>
                <Link href='/admin/blog'>
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Retour
                </Link>
              </Button>
              <Badge variant='secondary' className='bg-purple-50 text-purple-700 px-3 py-1'>
                <Edit3 className='w-3 h-3 mr-1' />
                Modification
              </Badge>
            </div>
            <h1 className='text-3xl font-bold text-gray-900'>Modifier l&apos;article</h1>
            <p className='text-gray-600 mt-1'>
              Éditez votre article et optimisez son référencement
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Button variant='outline' asChild className='hidden sm:flex'>
              <Link href={`/posts/article/${post.slug || post.id}`} target='_blank'>
                <Eye className='h-4 w-4 mr-2' />
                Aperçu
              </Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='bg-green-600 hover:bg-green-700 min-w-[120px]'
            >
              {isSubmitting ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Mise à jour...
                </div>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Editor Section */}
          <motion.div variants={itemVariants} className='lg:col-span-2 space-y-6'>
            {/* Title Input */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='h-5 w-5 text-yellow-600' />
                  Titre de l&apos;article
                </CardTitle>
                <CardDescription>
                  Un titre accrocheur est essentiel pour attirer l&apos;attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder='Entrez le titre de votre article...'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className='text-lg font-medium'
                />
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu de l&apos;article</CardTitle>
                <CardDescription>Utilisez Markdown pour formater votre contenu</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue='edit' className='w-full'>
                  <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger value='edit'>Éditer</TabsTrigger>
                    <TabsTrigger value='preview'>Aperçu</TabsTrigger>
                  </TabsList>
                  <TabsContent value='edit' className='mt-4'>
                    <LazyMarkdownEditor
                      value={content}
                      onChange={val => setContent(val || '')}
                      preview='edit'
                      height={400}
                      data-color-mode='light'
                    />
                  </TabsContent>
                  <TabsContent value='preview' className='mt-4'>
                    <div className='border rounded-lg p-4 min-h-[400px] bg-white'>
                      <LazyMarkdownViewer source={content} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={itemVariants} className='space-y-6'>
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ImagePlus className='h-5 w-5 text-green-600' />
                  Image de couverture
                </CardTitle>
                <CardDescription>Une image attrayante améliore l&apos;engagement</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {(currentImage || images.length > 0) && (
                  <div className='relative'>
                    <div className='aspect-video relative rounded-lg overflow-hidden bg-gray-100'>
                      {images.length > 0 ? (
                        <Image
                          src={URL.createObjectURL(images[0])}
                          alt='Nouvelle image'
                          fill
                          className='object-cover'
                        />
                      ) : (
                        <Image
                          src={currentImage}
                          alt='Image actuelle'
                          fill
                          className='object-cover'
                        />
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={removeImage}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                )}

                <div className='space-y-2'>
                  <Label htmlFor='image' className='text-sm font-medium'>
                    {currentImage || images.length > 0 ? "Changer l'image" : 'Ajouter une image'}
                  </Label>
                  <Input
                    id='image'
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Fields */}
            <SEOFieldsCard seoData={seoData} onSeoChange={setSeoData} articleTitle={title} />

            {/* Post Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Auteur:</span>
                  <span className='font-medium'>{post.author.name || post.author.email}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Créé le:</span>
                  <span className='font-medium'>
                    {new Date(post.createdAt || '').toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Slug:</span>
                  <span className='font-mono text-xs bg-gray-100 px-2 py-1 rounded'>
                    /{post.slug}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
