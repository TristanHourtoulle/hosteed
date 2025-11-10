'use client'

import React from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  title: string
  description: string
  url: string
}

export default function ShareButton({ title, description, url }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      // Construct full URL if relative path is provided
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`

      // Always use clipboard on desktop (Web Share API is mainly for mobile)
      // Only use Web Share on mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

      if (isMobile && navigator.share && navigator.canShare?.({ url: fullUrl })) {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        })
        toast.success('Partagé avec succès!')
        return
      }

      // Desktop: Always copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl)
        toast.success('Lien copié dans le presse-papiers!')
        return
      }

      // Last resort: manual copy fallback
      const textArea = document.createElement('textarea')
      textArea.value = fullUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
        toast.success('Lien copié dans le presse-papiers!')
      } catch (err) {
        console.error('Fallback copy failed:', err)
        toast.error('Impossible de copier le lien')
      } finally {
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Erreur lors du partage')
    }
  }

  return (
    <Button variant='outline' size='sm' onClick={handleShare} className='gap-2'>
      <Share2 className='w-4 h-4' />
      Partager
    </Button>
  )
}
