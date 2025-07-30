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
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié dans le presse-papier !', {
        description: 'Vous pouvez maintenant le partager avec vos amis.',
      })
    } catch (err) {
      toast.error('Impossible de copier le lien', {
        description: "Veuillez réessayer ou copier l'URL manuellement.",
      })
      console.error(err)
    }
  }

  return (
    <Button variant='outline' size='sm' className={className} onClick={handleShare}>
      <Share className='w-4 h-4 mr-2' />
      Partager
    </Button>
  )
}
