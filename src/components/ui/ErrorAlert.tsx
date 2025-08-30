'use client'

import { motion } from 'framer-motion'
import { 
  AlertCircle, 
  XCircle, 
  Wifi, 
  Image as ImageIcon, 
  Database, 
  Shield, 
  FileText,
  X 
} from 'lucide-react'

export interface ErrorDetails {
  type: 'validation' | 'network' | 'database' | 'file' | 'auth' | 'general'
  title: string
  message: string
  details?: string[]
  suggestions?: string[]
  retryable?: boolean
}

interface ErrorAlertProps {
  error: ErrorDetails | string | null
  onClose?: () => void
  onRetry?: () => void
}

const getErrorIcon = (type: ErrorDetails['type']) => {
  switch (type) {
    case 'validation':
      return <AlertCircle className='h-5 w-5' />
    case 'network':
      return <Wifi className='h-5 w-5' />
    case 'database':
      return <Database className='h-5 w-5' />
    case 'file':
      return <ImageIcon className='h-5 w-5' />
    case 'auth':
      return <Shield className='h-5 w-5' />
    default:
      return <XCircle className='h-5 w-5' />
  }
}

const getErrorColors = (type: ErrorDetails['type']) => {
  switch (type) {
    case 'validation':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-800',
        text: 'text-yellow-700'
      }
    case 'network':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-800',
        text: 'text-blue-700'
      }
    case 'file':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        title: 'text-purple-800',
        text: 'text-purple-700'
      }
    case 'auth':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        title: 'text-orange-800',
        text: 'text-orange-700'
      }
    default:
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        title: 'text-red-800',
        text: 'text-red-700'
      }
  }
}

export default function ErrorAlert({ error, onClose, onRetry }: ErrorAlertProps) {
  if (!error) return null

  // Si c'est juste une string, la convertir en ErrorDetails
  const errorDetails: ErrorDetails = typeof error === 'string' 
    ? {
        type: 'general',
        title: 'Erreur',
        message: error
      }
    : error

  const colors = getErrorColors(errorDetails.type)
  const icon = getErrorIcon(errorDetails.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='max-w-4xl mx-auto'
    >
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 relative`}>
        {onClose && (
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 ${colors.text} hover:opacity-70 transition-opacity`}
            aria-label='Fermer'
          >
            <X className='h-4 w-4' />
          </button>
        )}

        <div className='flex items-start gap-3'>
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {icon}
          </div>
          
          <div className='flex-1 space-y-3'>
            <div>
              <h3 className={`font-medium ${colors.title}`}>
                {errorDetails.title}
              </h3>
              <p className={`mt-1 ${colors.text}`}>
                {errorDetails.message}
              </p>
            </div>

            {errorDetails.details && errorDetails.details.length > 0 && (
              <div>
                <h4 className={`font-medium text-sm ${colors.title} mb-2`}>
                  Détails de l&apos;erreur :
                </h4>
                <ul className={`list-disc list-inside space-y-1 text-sm ${colors.text}`}>
                  {errorDetails.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}

            {errorDetails.suggestions && errorDetails.suggestions.length > 0 && (
              <div>
                <h4 className={`font-medium text-sm ${colors.title} mb-2`}>
                  <FileText className='inline h-4 w-4 mr-1' />
                  Solutions suggérées :
                </h4>
                <ul className={`list-disc list-inside space-y-1 text-sm ${colors.text}`}>
                  {errorDetails.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {(errorDetails.retryable && onRetry) && (
              <div className='pt-2'>
                <button
                  onClick={onRetry}
                  className={`px-3 py-1 bg-white border ${colors.border} ${colors.text} text-sm font-medium rounded-md hover:bg-gray-50 transition-colors`}
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}