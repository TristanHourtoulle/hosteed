'use client'

import { motion } from 'framer-motion'
import CategoryCard from './CategoryCard'

const categories = [
  {
    title: 'Appartements & Studios',
    description: "Location d'un appartement en centre ville ou dans un quartier calme.",
    imageUrl: '/images/categories/appartement.jpg',
    count: 13,
    href: '/host?type=Appartement',
  },
  {
    title: "Chambres d'hôtes",
    description: 'Séjournez dans une chambre accueillante pour une expérience conviviale.',
    imageUrl: '/images/categories/chambre-hote.jpg',
    count: 13,
    href: "/host?type=Chambre d'hôte",
  },
  {
    title: 'Hôtels - Ecolodges',
    description: "Location d'une chambre ou d'une suite pour une escapade sans souci.",
    imageUrl: '/images/categories/hotel.jpg',
    count: 62,
    href: '/host?type=Hôtel',
  },
  {
    title: 'Villas - Maisons de vacances',
    description: "Location d'une villa entière ou d'une maison de vacances pour un confort royal.",
    imageUrl: '/images/categories/villa.jpg',
    count: 24,
    href: '/host?type=Villa',
  },
]

export default function CategorySection() {
  return (
    <section className='py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='text-center mb-12 md:mb-16'
        >
          <div className='inline-block mb-4'>
            <div className='h-1 w-12 bg-gradient-to-r from-[#015993] to-[#0379C7] rounded-full mx-auto' />
          </div>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Des solutions pour toutes vos envies
          </h2>
          <p className='text-gray-600 text-lg md:text-xl'>
            Des établissements vérifiés, visités et garantis
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8'>
          {categories.map((category, index) => (
            <CategoryCard key={category.title} {...category} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
