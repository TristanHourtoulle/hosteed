'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { createMessage, getChatRent, markMessagesAsRead } from '@/lib/services/chat.service'
import { getRentById } from '@/lib/services/rents.service'
import { Chat } from '@prisma/client'

interface RentWithUser {
  product: {
    user: {
      id: string
      name: string | null
      email: string
    }[]
  }
}

interface ChatMessage {
  id: string
  message: string
  userId: string
  rentId: string
  host: boolean
  dateSended: Date
  read: boolean
}

export default function ChatPage() {
  const { data: session } = useSession()
  const params = useParams()
  const rentId = params.id as string
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Vérifier si l'utilisateur est l'hôte
  useEffect(() => {
    const checkIfHost = async () => {
      if (!session?.user?.id) return
      const rent = await getRentById(rentId)
      if (!rent || !rent.product?.user) return
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
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='px-4 py-4'>
          <h1 className='text-xl font-semibold text-gray-900'>Discussion</h1>
        </div>
      </div>
      <div className='flex-1 flex flex-col'>
        <Card className='flex-1 flex flex-col m-4'>
          <CardContent className='flex-1 flex flex-col p-0'>
            {/* Zone messages */}
            <div className='flex-1 overflow-y-auto p-6 space-y-4 bg-white/80 backdrop-blur-sm'>
              {loading ? (
                <div className='text-center text-gray-500'>Chargement de la discussion...</div>
              ) : error ? (
                <div className='text-center text-red-500'>{error}</div>
              ) : messages.length === 0 ? (
                <div className='text-center text-gray-400'>Aucun message pour le moment.</div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.host ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow text-sm
                                                  ${
                                                    msg.host
                                                      ? 'bg-blue-100 text-blue-900 rounded-bl-none'
                                                      : 'bg-emerald-100 text-emerald-900 rounded-br-none'
                                                  }
                                                `}
                    >
                      <div className='mb-1 font-semibold'>{msg.host ? 'Hébergeur' : 'Vous'}</div>
                      <div>{msg.message}</div>
                      <div className='text-xs text-gray-400 mt-1 text-right'>
                        {new Date(msg.dateSended).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Formulaire d'envoi */}
            <form
              onSubmit={handleSend}
              className='flex items-center gap-2 border-t bg-white/90 p-4'
            >
              <input
                type='text'
                className='flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50'
                placeholder='Écrivez un message...'
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                disabled={sending}
                maxLength={500}
                autoFocus
              />
              <Button type='submit' disabled={sending || !newMessage.trim()}>
                {sending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
