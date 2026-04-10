'use client'

import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { createPost } from '@/lib/services/post.service'
import { BlogPostForm, type BlogPostFormData } from '@/components/admin/blog/BlogPostForm'

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function CreatePostPage() {
  const { session, isLoading: isAuthLoading } = useAuth({
    required: true,
    redirectTo: '/auth',
  })
  const router = useRouter()

  if (isAuthLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-6xl space-y-8 p-6'>
          <div className='space-y-3'>
            <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
            <div className='h-10 w-80 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
        </div>
      </div>
    )
  }

  if (!session) return null

  const handleSubmit = async (data: BlogPostFormData) => {
    if (!session.user?.id) {
      toast.error('Vous devez être connecté pour créer un article')
      return
    }
    if (!data.newImageFile) {
      toast.error('Une image de couverture est requise')
      return
    }

    try {
      const base64 = await fileToBase64(data.newImageFile)
      const newPost = await createPost(
        data.title,
        data.content,
        base64,
        session.user.id,
        data.seoData
      )

      if (newPost) {
        toast.success('Article publié avec succès', {
          description: 'Votre article est maintenant en ligne.',
        })
        router.push(`/posts/article/${newPost.slug || newPost.id}`)
      } else {
        toast.error("Erreur lors de la création de l'article")
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error("Erreur lors de la création de l'article")
    }
  }

  return (
    <BlogPostForm
      mode='create'
      backHref='/admin/blog'
      backLabel='Retour au blog'
      eyebrow='Espace rédaction'
      eyebrowIcon={BookOpen}
      pageTitle='Créer un article'
      pageSubtitle='Partagez vos expériences et conseils avec la communauté Hosteed.'
      imageRequired
      submitLabel="Publier l'article"
      submittingLabel='Publication…'
      onSubmit={handleSubmit}
    />
  )
}
