'use client'

import { motion } from 'framer-motion'
import {
  LocationContactSection,
  ProductCharacteristicsForm,
} from '../index'
import type { FormData } from '../../types'

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface StepLocationProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  hasFieldError?: (field: string) => boolean
  getFieldError?: (field: string) => string | undefined
}

export function StepLocation({
  formData,
  setFormData,
  handleInputChange,
  hasFieldError,
  getFieldError,
}: StepLocationProps) {
  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      <LocationContactSection
        formData={formData as never}
        setFormData={setFormData as never}
        itemVariants={itemVariants}
      />

      <ProductCharacteristicsForm
        formData={formData as never}
        onInputChange={handleInputChange}
        itemVariants={itemVariants}
      />
    </motion.div>
  )
}
