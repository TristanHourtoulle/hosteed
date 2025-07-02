'use client'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getPost } from '@/lib/services/post.service'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { PlusCircle, Calendar, Clock, ChevronRight, Search } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

function truncateText(text: string, maxLength: number) {
  // Supprimer les balises Markdown
  const strippedText = text.replace(/[#*-]/g, '').replace(/\n/g, ' ').trim()
  if (strippedText.length <= maxLength) return strippedText
  return strippedText.substring(0, maxLength) + '...'
}

type SortOption = 'recent' | 'old' | 'az' | 'za'

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const { data: session } = useSession()

  const canCreatePost = session?.user?.roles === 'ADMIN' || session?.user?.roles === 'BLOGWRITTER'

  useEffect(() => {
    async function fetchPosts() {
      const res = await getPost()
      if (Array.isArray(res)) {
        setPosts(res)
        setFilteredPosts(res)
      } else {
        setPosts([])
        setFilteredPosts([])
      }
      setLoading(false)
    }
    fetchPosts()
  }, [])

  useEffect(() => {
    let sorted = [...posts]

    // Appliquer le tri
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'old':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'az':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'za':
        sorted.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    // Appliquer la recherche
    if (searchTerm) {
      sorted = sorted.filter(
        post =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPosts(sorted)
  }, [searchTerm, sortBy, posts])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  // Trouver l'article en vedette (le premier)
  const featuredPost = filteredPosts[0]
  const regularPosts = filteredPosts.slice(1)

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section avec l'article en vedette */}
      {featuredPost && (
        <div className='relative bg-gradient-to-b from-blue-50 to-gray-50'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
            <div className='max-w-7xl mx-auto'>
              {canCreatePost && (
                <div className='absolute top-4 right-4 sm:top-8 sm:right-8 z-10'>
                  <Link href='/createPost'>
                    <Button className='flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200'>
                      <PlusCircle className='h-5 w-5' />
                      Créer un article
                    </Button>
                  </Link>
                </div>
              )}

              <div className='grid lg:grid-cols-2 gap-8 items-center'>
                <div className='relative h-[400px] lg:h-[600px] w-full rounded-2xl overflow-hidden shadow-lg'>
                  <Image
                    src={featuredPost.image || '/placeholder.jpg'}
                    alt={featuredPost.title}
                    fill
                    className='object-cover'
                    priority
                  />
                </div>
                <div className='lg:pl-8'>
                  <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 mb-6'>
                    {featuredPost.title}
                  </h1>
                  <p className='text-lg text-gray-600 mb-8 line-clamp-3'>
                    {truncateText(featuredPost.content, 200)}
                  </p>
                  <Link href={`/posts/${featuredPost.id}`}>
                    <Button size='lg' className='group'>
                      Lire l'article
                      <ChevronRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et Recherche */}
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between mb-8'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <Input
                type='text'
                placeholder='Rechercher un article...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 w-full'
              />
            </div>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Trier par' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='recent'>Plus récent</SelectItem>
                <SelectItem value='old'>Plus ancien</SelectItem>
                <SelectItem value='az'>A à Z</SelectItem>
                <SelectItem value='za'>Z à A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Articles réguliers */}
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 pb-16'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl font-bold text-gray-900 mb-12'>Articles récents</h2>

          {filteredPosts.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-2xl shadow-sm'>
              <div className='text-gray-500 mb-4'>Aucun article trouvé.</div>
              {canCreatePost && (
                <Link href='/createPost'>
                  <Button variant='outline'>Créer le premier article</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {regularPosts.map(post => (
                <article
                  key={post.id}
                  className='group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100'
                >
                  <div className='relative h-64 w-full overflow-hidden rounded-t-2xl'>
                    <Image
                      src={post.image || '/placeholder.jpg'}
                      alt={post.title}
                      fill
                      className='object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                  </div>
                  <div className='flex-1 p-6'>
                    <h3 className='text-xl font-semibold text-gray-900 mb-3 line-clamp-2'>
                      {post.title}
                    </h3>
                    <p className='text-gray-600 mb-4 line-clamp-3'>
                      {truncateText(post.content, 150)}
                    </p>
                    <div className='flex items-center justify-between text-sm text-gray-500'>
                      <div className='flex items-center'>
                        <Clock className='h-4 w-4 mr-1' />
                        <span>5 min de lecture</span>
                      </div>
                      <div className='flex items-center'>
                        <Calendar className='h-4 w-4 mr-1' />
                        <span>
                          {format(new Date(post.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/posts/${post.id}`} className='absolute inset-0'>
                    <span className='sr-only'>Lire l'article</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
