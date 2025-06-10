import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  address: string
  img?: { img: string }[] | null
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className='block'>
      <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300'>
        <div className='relative h-48 w-full'>
          {product.img && product.img.length > 0 && product.img[0].img !== '' ? (
            <Image src={product.img[0].img} alt={product.name} fill className='object-cover' />
          ) : (
            <div className='bg-gray-200 h-full w-full flex items-center justify-center'>
              <span className='text-gray-500'>Aucune image</span>
            </div>
          )}
        </div>
        <div className='p-4'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>{product.name}</h3>
          <p className='text-gray-600 text-sm mb-2 line-clamp-2'>{product.description}</p>
          <p className='text-gray-500 text-sm'>{product.address}</p>
        </div>
      </div>
    </Link>
  )
}
