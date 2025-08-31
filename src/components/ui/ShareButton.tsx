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
      if (navigator.share) {
        await navigator.share({
          title,
          text: description,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Lien copié dans le presse-papiers!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Lien copié dans le presse-papiers!')
      } catch (clipboardError) {
        toast.error('Impossible de partager ou copier le lien')
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="w-4 h-4" />
      Partager
    </Button>
  )
}