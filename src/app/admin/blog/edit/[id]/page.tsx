'use client'

import { useCallback, useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { BookOpen, Eye, Calendar, UserCircle2, Link as LinkIcon } from 'lucide-react'

import { useBlogAuth } from '@/hooks/useMultiRoleAuth'
import { Button } from '@/components/ui/shadcnui/button'
import {
  BlogPostForm,
  type BlogPostFormData,
} from '@/components/admin/blog/BlogPostForm'
import { type SEOData } from '@/components/ui/SEOFieldsCard'

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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditPostPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { isAuthorized, isLoading, session } = useBlogAuth()
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [isLoadingPost, setIsLoadingPost] = useState(true)

  const fetchPost = useCallback(async () => {
    try {
      setIsLoadingPost(true)
      const response = await fetch(`/api/posts/${resolvedParams.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Article non trouvé')
          router.push('/admin/blog')
          return
        }
        throw new Error("Erreur lors du chargement de l'article")
      }

      const data = (await response.json()) as Post

      if (session?.user?.roles !== 'ADMIN' && data.author.id !== session?.user?.id) {
        toast.error('Vous ne pouvez modifier que vos propres articles')
        router.push('/admin/blog')
        return
      }

      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error("Erreur lors du chargement de l'article")
      router.push('/admin/blog')
    } finally {
      setIsLoadingPost(false)
    }
  }, [resolvedParams.id, session, router])

  useEffect(() => {
    if (isAuthorized && session?.user?.id) {
      fetchPost()
    }
  }, [isAuthorized, session, fetchPost])

  if (isLoading || isLoadingPost || !isAuthorized) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-6xl space-y-8 p-6'>
          <div className='space-y-3'>
            <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
            <div className='h-10 w-80 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='grid gap-6 lg:grid-cols-3'>
            <div className='space-y-6 lg:col-span-2'>
              <div className='h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
              <div className='h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
            </div>
            <div className='space-y-6'>
              <div className='h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
              <div className='h-60 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) return null

  const initialSeoData: SEOData = {
    metaTitle: post.metaTitle || post.title,
    metaDescription: post.metaDescription || '',
    keywords: post.keywords || '',
    slug: post.slug || '',
  }

  const handleSubmit = async (data: BlogPostFormData) => {
    try {
      let imageToUse = data.imageUrl
      if (data.newImageFile) {
        imageToUse = await fileToBase64(data.newImageFile)
      }

      const response = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          image: imageToUse,
          seoData: data.seoData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      toast.success('Article mis à jour', {
        description: 'Vos modifications ont été sauvegardées.',
      })
      router.push('/admin/blog')
    } catch (error) {
      console.error('Error updating post:', error)
      const message =
        error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'article"
      toast.error(message)
    }
  }

  const formattedCreatedAt = new Date(post.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const sidebarExtra = (
    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
      <div className='flex items-center gap-3 border-b border-slate-100 px-6 py-4'>
        <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600'>
          <UserCircle2 className='h-4 w-4' />
        </div>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>
          Informations
        </h2>
      </div>
      <dl className='space-y-3 p-6 text-sm'>
        <div className='flex items-start justify-between gap-4'>
          <dt className='flex items-center gap-1.5 text-slate-500'>
            <UserCircle2 className='h-3.5 w-3.5' />
            Auteur
          </dt>
          <dd className='truncate text-right font-medium text-slate-900'>
            {post.author.name || post.author.email}
          </dd>
        </div>
        <div className='flex items-start justify-between gap-4'>
          <dt className='flex items-center gap-1.5 text-slate-500'>
            <Calendar className='h-3.5 w-3.5' />
            Créé le
          </dt>
          <dd className='text-right font-medium text-slate-900'>
            {formattedCreatedAt}
          </dd>
        </div>
        {post.slug && (
          <div className='flex items-start justify-between gap-4'>
            <dt className='flex items-center gap-1.5 text-slate-500'>
              <LinkIcon className='h-3.5 w-3.5' />
              Slug
            </dt>
            <dd className='truncate rounded bg-slate-100 px-2 py-0.5 text-right font-mono text-xs text-slate-900'>
              /{post.slug}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )

  const headerActions = (
    <Button variant='outline' asChild className='gap-2'>
      <Link href={`/posts/article/${post.slug || post.id}`} target='_blank'>
        <Eye className='h-4 w-4' />
        Aperçu
      </Link>
    </Button>
  )

  return (
    <BlogPostForm
      mode='edit'
      backHref='/admin/blog'
      backLabel='Retour au blog'
      eyebrow='Espace rédaction'
      eyebrowIcon={BookOpen}
      pageTitle="Modifier l'article"
      pageSubtitle='Ajustez le contenu, mettez à jour l’image ou affinez le référencement SEO.'
      initialTitle={post.title}
      initialContent={post.content}
      initialImageUrl={post.image || ''}
      initialSeoData={initialSeoData}
      submitLabel='Sauvegarder'
      submittingLabel='Sauvegarde…'
      sidebarExtra={sidebarExtra}
      headerActions={headerActions}
      onSubmit={handleSubmit}
    />
  )
}
