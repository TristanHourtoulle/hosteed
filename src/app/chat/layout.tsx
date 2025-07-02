'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/shadcnui/card'
import { ScrollArea } from '@/components/ui/shadcnui/scroll-area'
import { Badge } from '@/components/ui/shadcnui/badge'
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

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [chats, setChats] = useState<GroupedChat[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

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
    return <>{children}</>
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      {/* Panneau latéral des conversations */}
      <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
        <div className='p-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>Conversations</h2>
        </div>
        <ScrollArea className='flex-1'>
          {loading ? (
            <div className='p-4 text-center text-gray-500'>Chargement...</div>
          ) : chats.length === 0 ? (
            <div className='p-4 text-center text-gray-500'>Aucune conversation</div>
          ) : (
            <div className='py-2'>
              {chats.map(chat => (
                <a
                  key={chat.rentId}
                  href={`/chat/${chat.rentId}`}
                  className={`block px-4 py-3 hover:bg-gray-50 ${
                    pathname === `/chat/${chat.rentId}` ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className='flex justify-between items-start mb-1'>
                    <h3 className='font-medium text-gray-900 truncate flex-1'>
                      {chat.productName}
                    </h3>
                    {chat.unreadCount > 0 && (
                      <Badge variant='default' className='ml-2'>
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className='text-sm text-gray-500 truncate'>{chat.otherUserName}</p>
                  <div className='flex justify-between items-center mt-1'>
                    <p className='text-sm text-gray-500 truncate flex-1'>{chat.lastMessage}</p>
                    <span className='text-xs text-gray-400'>
                      {chat.lastMessageDate.toLocaleDateString()}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      {/* Contenu principal */}
      <div className='flex-1'>{children}</div>
    </div>
  )
}
