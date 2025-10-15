'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { createMessage, getChatRent, markMessagesAsRead } from '@/lib/services/chat.service'
import { getRentById } from '@/lib/services/rents.service'
import { ArrowLeft, Send, MessageCircle, User as UserIcon, Home } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChatMessage {
  id: string
  message: string
  userId: string
  rentId: string
  host: boolean
  dateSended: Date
  read: boolean
}

interface RentInfo {
  id: string
  arrivingDate?: Date
  leavingDate?: Date
  peopleNumber?: number
  user?: {
    name?: string | null
    email: string
  }
  product?: {
    name: string
    address?: string
    basePrice: string
    user?: Array<{
      id: string
      name?: string | null
    }>
  }
}

export default function ChatPage() {
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const params = useParams()
  const rentId = params.id as string
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [rentInfo, setRentInfo] = useState<RentInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Vérifier si l'utilisateur est l'hôte et récupérer les infos
  useEffect(() => {
    const checkIfHost = async () => {
      if (!session?.user?.id) return
      const rent = await getRentById(rentId)
      if (!rent || !rent.product?.user) return
      
      // Stocker les informations de la réservation
      setRentInfo(rent)
      
      const isUserHost = rent.product.user.some(
        (user: { id: string }) => user.id === session.user?.id
      )
      setIsHost(isUserHost)
    }
    checkIfHost()
  }, [session, rentId])

  // Récupérer la discussion
  useEffect(() => {
    const fetchChat = async () => {
      if (!session?.user?.id) return
      setLoading(true)
      setError(null)
      try {
        const res = await getChatRent(rentId, isHost)
        if (!res) return
        if (Array.isArray(res)) {
          setMessages(res as unknown as ChatMessage[])
          await markMessagesAsRead(rentId, session.user.id)
        } else {
          setError('Erreur lors de la récupération des messages')
        }
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'message' in e) {
          setError((e as { message?: string }).message || 'Erreur inconnue')
        } else {
          setError('Erreur inconnue')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchChat()
    // Rafraîchir les messages toutes les 10 secondes
    const interval = setInterval(fetchChat, 10000)
    return () => clearInterval(interval)
  }, [rentId, session, isHost])

  // Scroll auto en bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Envoi d'un message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user?.id) return
    setSending(true)
    try {
      await createMessage(newMessage, isHost, rentId, session.user.id)
      setNewMessage('')
      // On recharge le message après envoi
      const res = await getChatRent(rentId, isHost)
      if (Array.isArray(res)) {
        setMessages(res as unknown as ChatMessage[])
      } else {
        setError('Erreur lors de la récupération des messages')
      }
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setError((e as { message?: string }).message || 'Erreur inconnue')
      } else {
        setError('Erreur inconnue')
      }
    } finally {
      setSending(false)
    }
  }

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
      {/* Sidebar - Simplified for chat view */}
      <div className='w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col'>
        <div className='px-6 py-4 border-b border-gray-100 bg-gray-50/50'>
          <Link 
            href='/chat' 
            className='flex items-center text-gray-600 hover:text-gray-900 transition-colors group mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1' />
            <span className='text-sm font-medium'>Toutes les conversations</span>
          </Link>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm'>
              <MessageCircle className='w-4 h-4 text-white' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-900'>
                {rentInfo?.product?.name || 'Discussion active'}
              </h1>
              <p className='text-xs text-gray-500'>
                {rentInfo ? (
                  isHost ? `Avec ${rentInfo.user?.name || 'l\'invité'}` : `Avec ${rentInfo.product?.user?.[0]?.name || 'l\'hôte'}`
                ) : (
                  'Chargement...'
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className='flex-1 p-6'>
          {rentInfo ? (
            <div className='space-y-6'>
              {/* Informations du logement */}
              <div className='bg-gray-50 rounded-xl p-4'>
                <h3 className='font-semibold text-gray-900 mb-3 flex items-center'>
                  <Home className='w-4 h-4 mr-2' />
                  Logement
                </h3>
                <div className='space-y-2'>
                  <h4 className='font-medium text-gray-800'>{rentInfo.product?.name}</h4>
                  {rentInfo.product?.address && (
                    <p className='text-sm text-gray-600 flex items-center'>
                      <span className='w-1 h-1 bg-gray-400 rounded-full mr-2'></span>
                      {rentInfo.product.address}
                    </p>
                  )}
                  <div className='flex items-center text-sm text-gray-500 mt-2'>
                    <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium'>
                      {rentInfo.product?.basePrice}€ / nuit
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations du contact */}
              <div className='bg-gray-50 rounded-xl p-4'>
                <h3 className='font-semibold text-gray-900 mb-3 flex items-center'>
                  <UserIcon className='w-4 h-4 mr-2' />
                  {isHost ? 'Invité' : 'Hôte'}
                </h3>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold'>
                    {isHost ? (
                      rentInfo.user?.name?.charAt(0)?.toUpperCase() || 'I'
                    ) : (
                      rentInfo.product?.user?.[0]?.name?.charAt(0)?.toUpperCase() || 'H'
                    )}
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {isHost ? rentInfo.user?.name : rentInfo.product?.user?.[0]?.name}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {isHost ? 'Voyageur' : 'Propriétaire'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations de la réservation */}
              <div className='bg-gray-50 rounded-xl p-4'>
                <h3 className='font-semibold text-gray-900 mb-3'>Réservation</h3>
                <div className='space-y-2 text-sm text-gray-600'>
                  <div className='flex justify-between'>
                    <span>Arrivée:</span>
                    <span className='font-medium'>
                      {rentInfo.arrivingDate ? format(new Date(rentInfo.arrivingDate), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Départ:</span>
                    <span className='font-medium'>
                      {rentInfo.leavingDate ? format(new Date(rentInfo.leavingDate), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Voyageurs:</span>
                    <span className='font-medium'>{rentInfo.peopleNumber || 1}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center text-sm text-gray-500 py-8'>
              <UserIcon className='w-8 h-8 mx-auto mb-2 text-gray-300' />
              <p>Chargement des informations...</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className='flex-1 flex flex-col h-full'>
        <div className='flex-1 flex flex-col bg-white overflow-hidden h-full'>
          <div className='flex-1 flex flex-col h-full'>
            {/* Messages Area */}
            <div className='flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 min-h-0'>
              {loading ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3'></div>
                    <p className='text-gray-500'>Chargement de la discussion...</p>
                  </div>
                </div>
              ) : error ? (
                <div className='text-center py-12'>
                  <div className='text-red-500 text-lg font-medium mb-2'>Erreur</div>
                  <p className='text-red-400'>{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className='text-center py-12'>
                  <MessageCircle className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun message</h3>
                  <p className='text-gray-500'>Commencez la conversation en envoyant un message.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isCurrentUser = msg.userId === session?.user?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end space-x-2 ${
                        isCurrentUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mb-1'>
                          {msg.host ? (
                            <Home className='w-4 h-4 text-white' />
                          ) : (
                            <UserIcon className='w-4 h-4 text-white' />
                          )}
                        </div>
                      )}
                      
                      <div className='flex flex-col max-w-xs md:max-w-md'>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            isCurrentUser
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm border'
                          }`}
                        >
                          <p className='text-sm leading-relaxed'>{msg.message}</p>
                        </div>
                        
                        <div className={`text-xs text-gray-400 mt-1 px-2 ${
                          isCurrentUser ? 'text-right' : 'text-left'
                        }`}>
                          <span className='font-medium'>
                            {msg.host ? 'Hébergeur' : isCurrentUser ? 'Vous' : 'Invité'}
                          </span>
                          <span className='mx-1'>•</span>
                          <span>
                            {format(new Date(msg.dateSended), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      
                      {isCurrentUser && (
                        <div className='w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mb-1'>
                          <UserIcon className='w-4 h-4 text-white' />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className='border-t bg-white p-4'>
              <form onSubmit={handleSend} className='flex items-end space-x-3'>
                <div className='flex-1'>
                  <div className='relative'>
                    <input
                      type='text'
                      className='w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 backdrop-blur-sm placeholder-gray-500'
                      placeholder='Écrivez votre message...'
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      disabled={sending}
                      maxLength={500}
                      autoFocus
                    />
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400'>
                      {newMessage.length}/500
                    </div>
                  </div>
                </div>
                
                <Button 
                  type='submit' 
                  disabled={sending || !newMessage.trim()}
                  className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
                    sending || !newMessage.trim() 
                      ? 'bg-gray-300 hover:bg-gray-300' 
                      : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-lg'
                  }`}
                >
                  {sending ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  ) : (
                    <Send className='w-4 h-4' />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
