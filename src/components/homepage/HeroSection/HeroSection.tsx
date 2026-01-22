'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ModernSearchBar from '@/components/ui/modernSearchBar'
import Image from 'next/image'

export default function HeroSection() {
  const router = useRouter()
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/homepage-settings')
        if (response.ok) {
          const data = await response.json()
          setBackgroundImage(data.heroBackgroundImage || null)
        }
      } catch (error) {
        console.error('Error fetching homepage settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const handleSearch = (data: {
    location: string
    checkIn: string
    checkOut: string
    guests: number
  }) => {
    const params = new URLSearchParams()

    if (data.location) {
      params.set('location', data.location)
    }

    if (data.checkIn) {
      params.set('checkIn', data.checkIn)
    }

    if (data.checkOut) {
      params.set('checkOut', data.checkOut)
    }

    if (data.guests > 1) {
      params.set('guests', data.guests.toString())
    }

    router.push(`/host?${params.toString()}`)
  }
  return (
    <section className='relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden'>
      {/* Background Image with Overlay */}
      <div className='absolute inset-0 z-0'>
        {backgroundImage ? (
          <Image
            src={backgroundImage}
            alt='Hero Background'
            fill
            className='object-cover'
            priority
          />
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-[#015993] via-[#0379C7] to-[#015993]' />
        )}
        {/* Gradient Overlay for better text readability */}
        <div className='absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/30' />
      </div>

      {/* Hero Content */}
      <div className='relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='text-center mb-8 md:mb-12'
        >
          {/* Subheadline */}
          <p className='text-white/90 text-sm md:text-base mb-4 font-medium'>
            La première sélection de locations de vacances à Madagascar.
          </p>

          {/* Main Headline */}
          <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2'>
            Le meilleur de Madagascar,
          </h1>
          <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#FFB800] to-[#FF8C00] bg-clip-text text-transparent'>
            rien que pour vous
          </h1>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <ModernSearchBar onSearch={handleSearch} />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className='absolute bottom-8 left-1/2 -translate-x-1/2 z-10'
      >
        <div className='flex flex-col items-center gap-2 text-white/70'>
          <span className='text-xs font-medium'>Découvrir</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className='w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2'
          >
            <div className='w-1.5 h-1.5 bg-white/70 rounded-full' />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
