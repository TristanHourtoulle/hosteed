import { Button } from '@/shadcnui'

interface ErrorStateProps {
  error: string
}

export default function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <p className='text-red-600'>{error}</p>
        <Button onClick={() => window.location.reload()} className='mt-4'>
          Réessayer
        </Button>
      </div>
    </div>
  )
}
