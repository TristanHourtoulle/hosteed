'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface Service {
  id: string
  name: string
}

interface ServiceSelectionSectionProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor: string
  bgColor: string
  borderColor: string
  services: Service[]
  selectedServiceIds: string[]
  onServiceToggle: (serviceId: string) => void
  itemVariants: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function ServiceSelectionSection({
  title,
  description,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  services,
  selectedServiceIds,
  onServiceToggle,
  itemVariants,
}: ServiceSelectionSectionProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
        <CardHeader className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className={`p-2 ${bgColor} rounded-lg`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <CardTitle className='text-xl'>{title}</CardTitle>
              <p className='text-slate-600 text-sm mt-1'>{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
            {services.map(service => (
              <label
                key={service.id}
                className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  selectedServiceIds.includes(service.id)
                    ? `${borderColor} ${bgColor}`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type='checkbox'
                  checked={selectedServiceIds.includes(service.id)}
                  onChange={() => onServiceToggle(service.id)}
                  className='sr-only'
                />
                <div className='flex items-center space-x-2 w-full'>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedServiceIds.includes(service.id)
                        ? `${borderColor.replace('border-', 'border-')} ${bgColor.replace('bg-', 'bg-').replace('/50', '')}`
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedServiceIds.includes(service.id) && (
                      <svg className='w-2 h-2 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    )}
                  </div>
                  <span className='text-xs font-medium text-slate-700 truncate'>
                    {service.name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
