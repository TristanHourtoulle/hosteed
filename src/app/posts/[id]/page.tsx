'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getPostById, getSuggestedPosts } from '@/lib/services/post.service'
import { Button } from '@/components/ui/shadcnui/button'
import { ArrowLeft, Calendar, Clock, PenSquare } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import SuggestedPosts from './components/SuggestedPosts'
import { useSession } from 'next-auth/react'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { cn } from '@/lib/utils'
import { Components } from 'react-markdown'
import { Post } from '@prisma/client'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

const MarkdownComponents = {
  h1: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLHeadingElement>
  }) => <h1 className={cn('mt-8 mb-4 text-4xl font-bold', className)} {...props} />,
  h2: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLHeadingElement>
  }) => <h2 className={cn('mt-8 mb-4 text-3xl font-bold', className)} {...props} />,
  h3: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLHeadingElement>
  }) => <h3 className={cn('mt-6 mb-4 text-2xl font-bold', className)} {...props} />,
  h4: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLHeadingElement>
  }) => <h4 className={cn('mt-6 mb-4 text-xl font-bold', className)} {...props} />,
  p: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLParagraphElement>
  }) => <p className={cn('mb-4 leading-7 text-gray-700', className)} {...props} />,
  a: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLAnchorElement>
  }) => (
    <a
      className={cn('text-blue-600 hover:text-blue-800 underline', className)}
      target='_blank'
      rel='noopener noreferrer'
      {...props}
    />
  ),
  ul: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLUListElement>
  }) => <ul className={cn('mb-4 ml-6 list-disc', className)} {...props} />,
  ol: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLOListElement>
  }) => <ol className={cn('mb-4 ml-6 list-decimal', className)} {...props} />,
  li: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLLIElement>
  }) => <li className={cn('mb-2', className)} {...props} />,
  blockquote: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLQuoteElement>
  }) => (
    <blockquote
      className={cn('border-l-4 border-gray-200 pl-4 mb-4 italic', className)}
      {...props}
    />
  ),
  code: ({
    inline,
    className,
    ...props
  }: {
    inline?: boolean
    className?: string
    props?: React.HTMLAttributes<HTMLElement>
  }) =>
    inline ? (
      <code
        className={cn('bg-gray-100 rounded px-1 py-0.5 text-sm font-mono', className)}
        {...props}
      />
    ) : (
      <pre className={cn('bg-gray-900 text-white p-4 rounded-lg mb-4 overflow-x-auto', className)}>
        <code className='text-sm' {...props} />
      </pre>
    ),
  table: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLTableElement>
  }) => (
    <div className='mb-4 overflow-x-auto'>
      <table className={cn('min-w-full divide-y divide-gray-200', className)} {...props} />
    </div>
  ),
  th: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLTableCellElement>
  }) => (
    <th
      className={cn(
        'px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
      {...props}
    />
  ),
  td: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLTableCellElement>
  }) => (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-500', className)} {...props} />
  ),
  img: ({
    src,
    alt,
    className,
    ...props
  }: {
    src?: string
    alt?: string
    className?: string
    props?: React.ImgHTMLAttributes<HTMLImageElement>
  }) => {
    if (!src) return null
    // Si l'image est une URL externe
    if (src.startsWith('http')) {
      return (
        <span className='block my-8'>
          <Image
            src={src}
            alt={alt || 'Image'}
            width={600}
            height={400}
            className={cn('rounded-lg max-w-full h-auto mx-auto', className)}
            {...props}
          />
        </span>
      )
    }
    // Pour les images locales
    return (
      <span className='block my-8 relative aspect-video'>
        <Image
          src={src}
          alt={alt || 'Image'}
          className={cn('rounded-lg object-cover', className)}
          fill
          {...props}
        />
      </span>
    )
  },
  hr: ({
    className,
    ...props
  }: {
    className?: string
    props?: React.HTMLAttributes<HTMLHRElement>
  }) => <hr className={cn('my-8 border-t border-gray-200', className)} {...props} />,
}

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [post, setPost] = React.useState<Post | null>(null)
  const [suggestedPosts, setSuggestedPosts] = React.useState<Post[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const isAuthorized = session?.user?.roles === 'ADMIN' || session?.user?.roles === 'BLOGWRITTER'

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [postData, suggestedData] = await Promise.all([
          getPostById(params.id as string),
          getSuggestedPosts(params.id as string),
        ])

        if (postData) {
          setPost(postData)
          setSuggestedPosts(suggestedData || [])
        } else {
          setError('Article non trouvé')
        }
      } catch (err) {
        setError("Une erreur est survenue lors du chargement de l'article")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              {error || 'Article non trouvé'}
            </h1>
            <p className='text-gray-600 mb-8'>
              L&apos;article que vous recherchez n&apos;existe pas ou a été supprimé.
            </p>
            <Link href='/posts'>
              <Button variant='outline' className='flex items-center gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Retour aux articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <div className='relative h-[60vh] min-h-[500px] w-full'>
        <Image
          src={post.image || '/placeholder.jpg'}
          alt={post.title}
          fill
          className='object-cover'
          priority
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />

        {/* Navigation */}
        <div className='absolute top-8 left-8 flex gap-4'>
          <Link href='/posts'>
            <Button
              variant='outline'
              className='flex items-center gap-2 bg-white/90 hover:bg-white'
            >
              <ArrowLeft className='h-4 w-4' />
              Retour aux articles
            </Button>
          </Link>
          {isAuthorized && (
            <Button
              onClick={() => router.push('/createPost')}
              className='flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700'
            >
              <PenSquare className='h-4 w-4' />
              Créer un article
            </Button>
          )}
        </div>

        {/* Title Overlay */}
        <div className='absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent'>
          <div className='container mx-auto max-w-4xl'>
            <h1 className='text-4xl sm:text-5xl font-bold text-white mb-4'>{post.title}</h1>
            <div className='flex items-center gap-6 text-sm text-white/80'>
              <div className='flex items-center'>
                <Calendar className='h-4 w-4 mr-1' />
                <span>{format(new Date(post.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>
              <div className='flex items-center'>
                <Clock className='h-4 w-4 mr-1' />
                <span>5 min de lecture</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='max-w-4xl mx-auto'>
          {/* Article Content */}
          <article className='prose prose-lg prose-blue max-w-none'>
            <ReactMarkdown
              components={MarkdownComponents as Components}
              remarkPlugins={[remarkGfm, remarkEmoji]}
              rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings]}
            >
              {post.content}
            </ReactMarkdown>
          </article>

          {/* Suggested Posts */}
          <SuggestedPosts posts={suggestedPosts.map(p => ({ ...p, image: p.image ?? '' }))} />

          {/* Article Footer */}
          <div className='mt-12 pt-8 border-t border-gray-200'>
            <Link href='/posts'>
              <Button variant='outline' className='flex items-center gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Retour aux articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
