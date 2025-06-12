interface PropertyDescriptionProps {
  description: string
}

export default function PropertyDescription({ description }: PropertyDescriptionProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>À propos de ce logement</h3>
      <p className='text-gray-700 leading-relaxed'>{description}</p>
    </div>
  )
}
