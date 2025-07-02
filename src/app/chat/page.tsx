'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { getAllUserChats } from '@/lib/services/chat.service'
import { Chat, Rent, User } from '@prisma/client'

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
  const { data: session } = useSession()
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

  if (!session) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Connexion requise</h2>
            <p className='text-gray-600 mb-6'>
              Veuillez vous connecter pour accéder à la messagerie
            </p>
            <Button asChild className='w-full'>
              <a href='/auth/signin'>Se connecter</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='p-6'>
            <h1 className='text-2xl font-bold text-gray-900 mb-6'>Mes conversations</h1>
            {loading ? (
              <div className='text-center text-gray-500'>Chargement des conversations...</div>
            ) : chats.length === 0 ? (
              <div className='text-center text-gray-500'>Aucune conversation</div>
            ) : (
              <div className='space-y-4'>
                {chats.map(chat => (
                  <a
                    key={chat.rentId}
                    href={`/chat/${chat.rentId}`}
                    className='block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4'
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <h3 className='font-medium text-gray-900'>{chat.productName}</h3>
                      <span className='text-sm text-gray-500'>
                        {chat.lastMessageDate.toLocaleDateString()}
                      </span>
                    </div>
                    <p className='text-sm text-gray-600 mb-2'>{chat.otherUserName}</p>
                    <div className='flex justify-between items-center'>
                      <p className='text-sm text-gray-500 truncate flex-1'>{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className='ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full'>
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
