import MarkdownRenderer from '@/components/ui/MarkdownRenderer'

interface PropertyDescriptionProps {
  description: string
}

export default function PropertyDescription({ description }: PropertyDescriptionProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>À propos de ce logement</h3>
      <div className='text-gray-700 leading-relaxed prose prose-slate max-w-none'>
        <MarkdownRenderer content={description} />
      </div>
    </div>
  )
}
