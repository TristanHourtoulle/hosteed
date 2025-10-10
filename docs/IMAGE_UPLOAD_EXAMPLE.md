# 🎨 Exemples d'Utilisation - Upload d'Images

## 1. Dans un Formulaire de Création de Produit

```typescript
// components/product/ImageUploader.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadedImage {
  thumb: string
  medium: string
  full: string
}

export function ImageUploader({ productId, onImagesUploaded }: {
  productId: string
  onImagesUploaded: (images: UploadedImage[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      // Convertir les fichiers en base64
      const base64Images = await Promise.all(
        Array.from(files).map(file => fileToBase64(file))
      )

      // Upload via l'API
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: base64Images,
          entityType: 'products',
          entityId: productId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setImages(data.images)
        onImagesUploaded(data.images)
        toast.success(`${data.count} images uploadées avec succès!`)
      } else {
        toast.error('Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload des images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesUploaded(newImages)
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Choisir des images
            </>
          )}
        </Button>
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <Image
                src={image.thumb}
                alt={`Image ${index + 1}`}
                width={300}
                height={200}
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

---

## 2. Dans la Création de Produit (Server Action)

```typescript
// app/createProduct/actions.ts
'use server'

import { saveImages } from '@/lib/services/image.service'
import prisma from '@/lib/prisma'

export async function createProductWithImages(formData: FormData) {
  const images = formData.getAll('images') as string[]
  const productName = formData.get('name') as string
  // ... autres champs

  // 1. Créer le produit
  const product = await prisma.product.create({
    data: {
      name: productName,
      // ... autres champs
    },
  })

  // 2. Upload et optimiser les images
  const uploadedImages = await saveImages(images, {
    entityType: 'products',
    entityId: product.id,
  })

  // 3. Sauvegarder les URLs dans la DB
  await prisma.image.createMany({
    data: uploadedImages.map(({ thumb, medium, full }, index) => ({
      productId: product.id,
      img: thumb,  // URL du thumbnail
      // Si vous avez les champs dans le schéma:
      // thumbUrl: thumb,
      // mediumUrl: medium,
      // fullUrl: full,
      order: index,
    })),
  })

  return { success: true, product }
}
```

---

## 3. Affichage Responsive des Images

```tsx
// components/product/ProductImage.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImageUrls {
  thumb: string
  medium: string
  full: string
}

export function ProductImage({ images, alt }: {
  images: ImageUrls
  alt: string
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <>
      {/* Thumbnail pour la liste */}
      <div className="md:hidden">
        <Image
          src={images.thumb}
          alt={alt}
          width={300}
          height={200}
          loading="lazy"
          onClick={() => setIsFullscreen(true)}
        />
      </div>

      {/* Medium pour tablette */}
      <div className="hidden md:block lg:hidden">
        <Image
          src={images.medium}
          alt={alt}
          width={800}
          height={600}
          onClick={() => setIsFullscreen(true)}
        />
      </div>

      {/* Full pour desktop */}
      <div className="hidden lg:block">
        <Image
          src={images.full}
          alt={alt}
          width={1920}
          height={1440}
          priority
          onClick={() => setIsFullscreen(true)}
        />
      </div>

      {/* Modal Fullscreen */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <Image
            src={images.full}
            alt={alt}
            width={1920}
            height={1440}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  )
}
```

---

## 4. Migration d'un Produit Existant

```typescript
// scripts/migrate-single-product.ts
import { migrateBase64ToFileSystem } from '../src/lib/services/image.service'
import prisma from '../src/lib/prisma'

async function migrateSingleProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { img: true },
  })

  if (!product) throw new Error('Product not found')

  console.log(`Migrating ${product.img.length} images...`)

  for (let i = 0; i < product.img.length; i++) {
    const image = product.img[i]

    const urls = await migrateBase64ToFileSystem(
      image.img,
      'products',
      product.id,
      i
    )

    await prisma.image.update({
      where: { id: image.id },
      data: {
        img: urls.thumb,
        // Si schéma modifié:
        // thumbUrl: urls.thumb,
        // mediumUrl: urls.medium,
        // fullUrl: urls.full,
      },
    })

    console.log(`✅ Migrated image ${i + 1}/${product.img.length}`)
  }

  console.log('✅ Migration complete!')
}

// Usage: pnpm tsx scripts/migrate-single-product.ts abc123
const productId = process.argv[2]
if (!productId) {
  console.error('Usage: pnpm tsx scripts/migrate-single-product.ts <productId>')
  process.exit(1)
}

migrateSingleProduct(productId)
```

---

## 5. Hook Réutilisable

```typescript
// hooks/useImageUpload.ts
import { useState } from 'react'
import { toast } from 'sonner'

interface UploadedImage {
  thumb: string
  medium: string
  full: string
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])

  const uploadImages = async (
    files: File[],
    entityType: 'products' | 'users' | 'posts',
    entityId: string
  ) => {
    setUploading(true)

    try {
      // Convertir en base64
      const base64Images = await Promise.all(
        files.map(file => fileToBase64(file))
      )

      // Upload
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: base64Images,
          entityType,
          entityId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      setImages(data.images)
      toast.success(`${data.count} images uploadées!`)

      return data.images
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload')
      throw error
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const clearImages = () => {
    setImages([])
  }

  return {
    uploading,
    images,
    uploadImages,
    removeImage,
    clearImages,
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

Usage du hook:

```tsx
function CreateProductForm() {
  const [productId] = useState(() => generateId())
  const { uploading, images, uploadImages } = useImageUpload()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await uploadImages(files, 'products', productId)
  }

  return (
    <form>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {/* ... */}
    </form>
  )
}
```

---

## 6. Batch Migration Complète

```typescript
// scripts/batch-migrate-all.ts
import { PrismaClient } from '@prisma/client'
import { migrateBase64ToFileSystem } from '../src/lib/services/image.service'
import pLimit from 'p-limit'

const prisma = new PrismaClient()

async function batchMigrateAll() {
  // Limiter à 5 uploads simultanés pour ne pas surcharger
  const limit = pLimit(5)

  const products = await prisma.product.findMany({
    where: {
      img: {
        some: {
          img: { not: { startsWith: '/uploads/' } }
        }
      }
    },
    include: { img: true },
  })

  console.log(`🚀 Migrating ${products.length} products...`)

  const tasks = products.map(product =>
    limit(async () => {
      for (let i = 0; i < product.img.length; i++) {
        const urls = await migrateBase64ToFileSystem(
          product.img[i].img,
          'products',
          product.id,
          i
        )

        await prisma.image.update({
          where: { id: product.img[i].id },
          data: { img: urls.thumb },
        })
      }

      console.log(`✅ ${product.name}`)
    })
  )

  await Promise.all(tasks)
  console.log('✨ Migration complete!')
}

batchMigrateAll()
```

---

Ces exemples couvrent tous les cas d'usage courants ! 🚀
