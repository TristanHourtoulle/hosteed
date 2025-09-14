import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPostBySlugOrId, getSuggestedPosts } from '@/lib/services/post.service'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import ShareButton from '@/components/ui/ShareButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  BookOpen, 
  Tag 
} from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlugOrId(slug)

  if (!post) {
    return {
      title: 'Article non trouvé | Hosteed',
      description: 'Cet article n\'existe pas ou a été supprimé.'
    }
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.content.substring(0, 160),
    keywords: post.keywords || '',
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.content.substring(0, 160),
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.image ? [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.content.substring(0, 160),
      images: post.image ? [post.image] : [],
    },
    alternates: {
      canonical: `/posts/article/${post.slug || post.id}`
    }
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlugOrId(slug)

  if (!post) {
    notFound()
  }

  // Get suggested posts
  const suggestedPosts = await getSuggestedPosts(post.id, 3)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    const readingTime = Math.ceil(words / wordsPerMinute)
    return readingTime
  }

  const shareUrl = `https://hosteed.com/posts/article/${post.slug || post.id}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800">
            <Link href="/posts" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux articles
            </Link>
          </Button>
        </div>

        {/* Article Header */}
        <article className="space-y-8">
          <div className="space-y-6">
            {/* Hero Image */}
            {post.image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Article Meta */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={post.createdAt.toISOString()}>
                        {formatDate(post.createdAt)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{estimateReadingTime(post.content)} min de lecture</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Blog Hosteed</span>
                    </div>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                    {post.title}
                  </h1>

                  {/* Keywords */}
                  {post.keywords && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-purple-600" />
                      {post.keywords.split(',').map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                          {keyword.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Share Button */}
                  <div className="flex items-center gap-3">
                    <ShareButton 
                      title={post.title}
                      description={post.metaDescription || post.title}
                      url={shareUrl}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Article Content */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-8">
              <MarkdownRenderer content={post.content} />
            </CardContent>
          </Card>

          {/* Suggested Articles */}
          {suggestedPosts && suggestedPosts.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Articles suggérés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {suggestedPosts.map((suggestedPost) => (
                    <Link key={suggestedPost.id} href={`/posts/article/${suggestedPost.slug || suggestedPost.id}`}>
                      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                        {suggestedPost.image && (
                          <div className="relative aspect-video">
                            <Image
                              src={suggestedPost.image}
                              alt={suggestedPost.title}
                              fill
                              className="object-cover rounded-t-lg"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {suggestedPost.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(suggestedPost.createdAt)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </article>

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.metaDescription || post.content.substring(0, 160),
              "image": post.image || '',
              "author": {
                "@type": "Organization",
                "name": "Hosteed"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Hosteed",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://hosteed.com/logo.png"
                }
              },
              "datePublished": post.createdAt.toISOString(),
              "dateModified": post.updatedAt.toISOString(),
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://hosteed.com/posts/article/${post.slug || post.id}`
              }
            })
          }}
        />
      </div>
    </div>
  )
}