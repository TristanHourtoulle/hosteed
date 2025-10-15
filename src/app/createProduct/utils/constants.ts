// Animation variants for Framer Motion
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

// Image upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
export const MAX_IMAGES = 20

// Form validation constants
export const MIN_PRICE = 0
export const MAX_PRICE = 999999
export const MIN_ROOMS = 1
export const MAX_ROOMS = 100
export const MIN_BATHROOMS = 1
export const MAX_BATHROOMS = 50
