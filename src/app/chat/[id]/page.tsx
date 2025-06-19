'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import {createMessage, getChatRent} from "@/lib/services/chat.service";

// Définition du type Message selon le modèle Chat de Prisma
interface Message {
    id: string;
    message: string;
    userId: string;
    rentId: string;
    host: boolean;
    dateSended: string | number | Date;
}

export default function ChatPage() {
    const { data: session } = useSession()
    const params = useParams()
    const rentId = params.id as string
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Récupérer la discussion
    useEffect(() => {
        const fetchChat = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await getChatRent(rentId, false);
                console.log(res)
                if (!res) return;
                if (Array.isArray(res)) {
                    setMessages(res)
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
    }, [rentId])

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
            const request = await createMessage(newMessage, false, rentId, session.user.id)
            console.log(request)
            setNewMessage('')
            // On recharge le message après envoi
            const res = await getChatRent(rentId, false)
            console.log(res)
            if (Array.isArray(res)) {
                setMessages(res)
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
                        <p className='text-gray-600 mb-6'>Veuillez vous connecter pour accéder à la messagerie</p>
                        <Button asChild className='w-full'>
                            <a href='/auth/signin'>Se connecter</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className='min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50'>
            {/* Header */}
            <div className='bg-white shadow-sm border-b'>
                <div className='container mx-auto px-4 py-8'>
                    <h1 className='text-4xl font-bold text-gray-900 mb-2'>Messagerie</h1>
                </div>
            </div>
            <div className='flex-1 flex flex-col items-center justify-center'>
                <div className='w-full max-w-2xl flex flex-col flex-1 h-[70vh]'>
                    <Card className='flex-1 flex flex-col h-full'>
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
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.host ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow text-sm
                                                  ${msg.host
                                                    ? 'bg-blue-100 text-blue-900 rounded-bl-none'
                                                    : 'bg-emerald-100 text-emerald-900 rounded-br-none'}
                                                `}
                                            >
                                                <div className='mb-1 font-semibold'>
                                                    {msg.host ? "Hébergeur" : "Vous"}
                                                </div>
                                                <div>{msg.message}</div>
                                                <div className='text-xs text-gray-400 mt-1 text-right'>
                                                    {new Date(Number(msg.dateSended)).toLocaleString('fr-FR', {
                                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                                        hour: '2-digit', minute: '2-digit'
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
        </div>
    )
}
