import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar } from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  image: string
  createdAt: Date
}

interface SuggestedPostsProps {
  posts: Post[]
}

export default function SuggestedPosts({ posts }: SuggestedPostsProps) {
  if (!posts || posts.length === 0) return null

  return (
    <div className='mt-16 border-t border-gray-200 pt-16'>
      <h2 className='text-3xl font-bold text-gray-900 mb-8'>Articles similaires</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {posts.map(post => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className='group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
          >
            <div className='relative h-48 rounded-t-lg overflow-hidden'>
              <Image
                src={post.image || '/placeholder.jpg'}
                alt={post.title}
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-200'
              />
            </div>
            <div className='p-6'>
              <div className='flex items-center text-sm text-gray-500 mb-2'>
                <Calendar className='h-4 w-4 mr-1' />
                <time dateTime={post.createdAt.toISOString()}>
                  {format(new Date(post.createdAt), 'dd MMMM yyyy', { locale: fr })}
                </time>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200'>
                {post.title}
              </h3>
              <p className='mt-2 text-gray-600 line-clamp-2'>
                {post.content.replace(/[#*[\]`>-]/g, '').slice(0, 150)}...
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
