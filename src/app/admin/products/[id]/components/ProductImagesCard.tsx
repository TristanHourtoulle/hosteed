'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { ImageIcon } from 'lucide-react'
import Image from 'next/image'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductImagesCardProps {
  images: Array<{ id: string; img: string }>
  productName: string
}

/** Product image gallery. */
export function ProductImagesCard({ images, productName }: ProductImagesCardProps) {
  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <ImageIcon className='h-5 w-5 text-blue-600' />
            Images ({images.length})
          </h2>
        </div>
        <CardContent className='p-6'>
          {images.length === 0 ? (
            <p className='text-gray-500 text-sm'>Aucune image.</p>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
              {images.map((image, index) => (
                <div key={image.id} className='relative aspect-[4/3] rounded-lg overflow-hidden'>
                  <Image
                    src={image.img}
                    alt={`${productName} - Image ${index + 1}`}
                    fill
                    className='object-cover'
                    sizes='(max-width: 768px) 50vw, 25vw'
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
