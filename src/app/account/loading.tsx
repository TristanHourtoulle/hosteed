import { Card, CardContent, CardHeader } from '@/components/ui/shadcnui/card'
import { Skeleton } from '@/components/ui/shadcnui/skeleton'

export default function AccountLoading() {
  return (
    <div className='container mx-auto py-10'>
      <div className='grid gap-8'>
        {/* Profile Header Skeleton */}
        <Card>
          <CardContent className='flex items-center gap-6 p-6'>
            <Skeleton className='size-24 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-4 w-64' />
              <Skeleton className='h-4 w-56' />
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section Skeleton */}
        <div>
          <div className='border-b mb-6'>
            <div className='flex gap-4'>
              <Skeleton className='h-10 w-24' />
              <Skeleton className='h-10 w-24' />
              <Skeleton className='h-10 w-24' />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className='grid gap-6'>
            <Skeleton className='h-8 w-48' />
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {[1, 2, 3].map(i => (
                <Card key={i} className='overflow-hidden'>
                  <Skeleton className='aspect-video w-full' />
                  <CardContent className='p-6 space-y-4'>
                    <Skeleton className='h-6 w-3/4' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-10 w-full' />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
