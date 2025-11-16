'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getAllUserChats } from '@/lib/services/chat.service'
import { Chat, Rent, User } from '@prisma/client'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChatWithRent extends Chat {
  rent: Rent & {
    product: {
      name: string
    }
    user: User
  }
}

interface GroupedChat {
  rentId: string
  productName: string
  lastMessage: string
  lastMessageDate: Date
  unreadCount: number
  otherUserName: string
}

export default function ChatIndexPage() {
  const {
    session,
    isLoading: isAuthLoading,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const [chats, setChats] = useState<GroupedChat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChats = async () => {
      if (!session?.user?.id) return
      try {
        const response = await getAllUserChats(session.user.id)
        if (Array.isArray(response)) {
          // Grouper les chats par rentId
          const groupedChats = response.reduce(
            (acc: { [key: string]: GroupedChat }, chat: ChatWithRent) => {
              const rentId = chat.rentId
              if (!acc[rentId]) {
                acc[rentId] = {
                  rentId,
                  productName: chat.rent.product.name,
                  lastMessage: chat.message,
                  lastMessageDate: new Date(chat.dateSended),
                  unreadCount: 0,
                  otherUserName: chat.rent.user.name || chat.rent.user.email,
                }
              }
              // Mettre à jour le dernier message si plus récent
              if (new Date(chat.dateSended) > new Date(acc[rentId].lastMessageDate)) {
                acc[rentId].lastMessage = chat.message
                acc[rentId].lastMessageDate = new Date(chat.dateSended)
              }
              // Incrémenter le compteur de messages non lus
              if (!chat.read && chat.userId !== session.user?.id) {
                acc[rentId].unreadCount++
              }
              return acc
            },
            {}
          )

          // Convertir en tableau et trier par date du dernier message
          const sortedChats = Object.values(groupedChats).sort(
            (a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
          )
          setChats(sortedChats)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
    // Rafraîchir les conversations toutes les 30 secondes
    const interval = setInterval(fetchChats, 30000)
    return () => clearInterval(interval)
  }, [session])

  if (isAuthLoading) {
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

  return (
    <div className='h-[calc(100vh-5rem)] pt-20 bg-white flex'>
      {/* Sidebar - Liste des conversations */}
      <div className='w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col'>
        {/* Sidebar Header */}
        <div className='px-6 py-4 border-b border-gray-100 bg-gray-50/50'>
          <div className='flex items-center justify-between mb-4'>
            <Link
              href='/dashboard/host'
              className='flex items-center text-gray-600 hover:text-gray-900 transition-colors group'
            >
              <ArrowLeft className='w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1' />
              <span className='text-sm font-medium'>Retour</span>
            </Link>
          </div>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm'>
              <MessageCircle className='w-4 h-4 text-white' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-900'>Messages</h1>
              <p className='text-xs text-gray-500'>
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className='flex-1 overflow-hidden'>
          <div className='h-full max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3'></div>
                  <p className='text-sm text-gray-500'>Chargement...</p>
                </div>
              </div>
            ) : chats.length === 0 ? (
              <div className='p-6 text-center'>
                <MessageCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                <h3 className='text-sm font-medium text-gray-900 mb-1'>Aucune conversation</h3>
                <p className='text-xs text-gray-500'>Les messages apparaîtront ici</p>
              </div>
            ) : (
              <div className='space-y-1 py-2'>
                {chats.map((chat, index) => (
                  <Link key={chat.rentId} href={`/chat/${chat.rentId}`} className='group block'>
                    <div className='px-4 py-3 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0'>
                      <div className='flex items-center space-x-3'>
                        {/* Avatar */}
                        <div className='relative flex-shrink-0'>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-sm ${
                              index % 4 === 0
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                : index % 4 === 1
                                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                                  : index % 4 === 2
                                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                                    : 'bg-gradient-to-br from-orange-500 to-orange-600'
                            }`}
                          >
                            <span className='text-sm'>
                              {chat.otherUserName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {chat.unreadCount > 0 && (
                            <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
                              <span className='text-xs font-bold text-white'>
                                {Math.min(chat.unreadCount, 9)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between mb-1'>
                            <h3 className='text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors'>
                              {chat.productName}
                            </h3>
                            <span className='text-xs text-gray-500 ml-2 flex-shrink-0'>
                              {format(new Date(chat.lastMessageDate), 'HH:mm', { locale: fr })}
                            </span>
                          </div>

                          <div className='flex items-center justify-between'>
                            <p className='text-xs text-gray-600 truncate pr-2'>
                              <span className='font-medium'>{chat.otherUserName}:</span>{' '}
                              {chat.lastMessage}
                            </p>
                            {chat.unreadCount > 0 && (
                              <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'></div>
                            )}
                          </div>

                          <div className='text-xs text-gray-400 mt-1'>
                            {format(new Date(chat.lastMessageDate), 'dd/MM', { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Placeholder when no chat selected */}
      <div className='flex-1 flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto px-6'>
          <div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <MessageCircle className='w-10 h-10 text-blue-500' />
          </div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Sélectionnez une conversation
          </h2>
          <p className='text-gray-500 text-sm leading-relaxed'>
            Choisissez une conversation dans la liste pour commencer à échanger avec vos hôtes ou
            invités.
          </p>
          <div className='mt-8 text-xs text-gray-400'>
            <div className='flex items-center justify-center space-x-4'>
              <span>💬 Messages instantanés</span>
              <span>📱 Responsive</span>
              <span>🔔 Notifications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
