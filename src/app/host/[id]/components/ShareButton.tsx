'use client'

import { Share } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { toast } from 'sonner'

interface ShareButtonProps {
  className?: string
}

export function ShareButton({ className }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment')
      }

      const url = window.location.href

      // Try Web Share API first (works better on mobile)
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: url,
        })
        toast.success('Partagé avec succès !')
        return
      }

      // Fallback to clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        toast.success('Lien copié dans le presse-papier !', {
          description: 'Vous pouvez maintenant le partager avec vos amis.',
        })
        return
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
        textArea.remove()
        toast.success('Lien copié dans le presse-papier !')
      } catch (err) {
        textArea.remove()
        throw err
      }
    } catch (err) {
      console.error('Share error:', err)
      toast.error('Impossible de copier le lien', {
        description: "Veuillez réessayer ou copier l'URL manuellement.",
      })
    }
  }

  return (
    <Button variant='outline' size='sm' className={className} onClick={handleShare}>
      <Share className='w-4 h-4 mr-2' />
      Partager
    </Button>
  )
}
