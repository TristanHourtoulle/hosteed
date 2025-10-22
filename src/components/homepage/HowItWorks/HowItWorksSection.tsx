'use client'

import { motion } from 'framer-motion'
import { Bed, Calendar, Mail, MessageSquare } from 'lucide-react'
import StepCard from './StepCard'
import Image from 'next/image'

const steps = [
  {
    icon: Bed,
    title: 'Trouvez un hébergement',
    description:
      'Explorez nos options et choisissez votre coin de paradis parmi notre sélection vérifiée.',
  },
  {
    icon: Calendar,
    title: 'Réservez une date',
    description: 'Fixez vos vacances en quelques clics. Simple, rapide et sécurisé.',
  },
  {
    icon: Mail,
    title: 'Recevez une confirmation',
    description: "Un e-mail, et c'est officiel : vos vacances sont réservées et garanties.",
  },
  {
    icon: MessageSquare,
    title: 'Payez et discutez sur la plateforme',
    description:
      'Réglez en toute sécurité et échangez avec votre hôte directement sur notre plateforme.',
  },
]

export default function HowItWorksSection() {
  return (
    <section className='py-16 md:py-24 bg-white'>
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
            Comment ça fonctionne ?
          </h2>
          <p className='text-gray-600 text-lg md:text-xl'>Facile, rapide et sécurisé</p>
        </motion.div>

        {/* Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
          {/* Steps - Left Side */}
          <div className='space-y-6'>
            {steps.map((step, index) => (
              <StepCard
                key={step.title}
                number={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
                index={index}
              />
            ))}
          </div>

          {/* Image - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className='relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl'
          >
            <Image
              src='/images/beach-relax.jpg'
              alt='Couple relaxing on beach chairs in Madagascar'
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 50vw'
              priority={false}
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
