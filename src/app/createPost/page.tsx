'use client' // Page de création de post : permet d'ajouter un titre, des images et un contenu formaté en Markdown avec prévisualisation.
import React, { useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import Image from 'next/image'
import { createPost } from '@/lib/services/post.service'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Button } from '@/components/ui/shadcnui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { ScrollArea } from '@/components/ui/shadcnui/scroll-area'
import { ImagePlus, FileImage, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CreatePostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      // Limit to 1 image for now since the API only supports one image
      setImages([newImages[0]])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Le titre et le contenu sont requis')
      return
    }

    if (images.length === 0) {
      toast.error('Une image est requise')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.readAsDataURL(images[0])
      reader.onload = async () => {
        const base64Image = reader.result as string
        await createPost(title, content, base64Image)
        toast.success('Article créé avec succès !')
        // Reset form
        setTitle('')
        setContent('')
        setImages([])
      }
      router.push('/posts')
    } catch (error) {
      toast.error("Erreur lors de la création de l'article")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
      <Card className='bg-white shadow-lg'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl md:text-3xl font-bold'>Créer un article</CardTitle>
          <CardDescription className='text-muted-foreground'>
            Rédigez votre article en utilisant le format Markdown pour une mise en forme riche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title' className='text-base'>
                Titre de l&apos;article
              </Label>
              <Input
                id='title'
                placeholder='Un titre accrocheur...'
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className='text-lg h-12'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='images' className='flex items-center gap-2 text-base'>
                <FileImage className='w-5 h-5' />
                Image principale
              </Label>
              <div className='flex items-center gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className='w-full h-12 text-base'
                >
                  <ImagePlus className='w-5 h-5 mr-2' />
                  {images.length === 0 ? 'Sélectionner une image' : "Changer l'image"}
                </Button>
                <input
                  id='image-upload'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='hidden'
                />
              </div>
              {images.length > 0 && (
                <div className='relative w-full aspect-video rounded-lg overflow-hidden border'>
                  <Image
                    src={typeof window !== 'undefined' ? URL.createObjectURL(images[0]) : ''}
                    alt='Image principale'
                    fill
                    className='object-cover'
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white hover:text-white/80'
                    onClick={() => setImages([])}
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <Label className='text-base'>Contenu de l&apos;article</Label>
              <Tabs defaultValue='edit' className='w-full'>
                <TabsList className='w-full'>
                  <TabsTrigger value='edit' className='w-1/2'>
                    Édition
                  </TabsTrigger>
                  <TabsTrigger value='preview' className='w-1/2'>
                    Prévisualisation
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='edit' className='mt-4'>
                  <div data-color-mode='light' className='rounded-md border'>
                    <MDEditor
                      value={content}
                      onChange={value => setContent(value || '')}
                      height={400}
                      preview='edit'
                      className='border-none'
                    />
                  </div>
                </TabsContent>
                <TabsContent value='preview' className='mt-4'>
                  <ScrollArea className='h-[400px] w-full rounded-md border p-4 bg-white'>
                    <div data-color-mode='light'>
                      <MDEditor.Markdown source={content || '*Aucun contenu*'} />
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </form>
        </CardContent>
        <CardFooter className='flex justify-end space-x-4 pt-6'>
          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='w-full sm:w-auto h-12 text-base'
          >
            <Save className='w-5 h-5 mr-2' />
            {isSubmitting ? 'Publication...' : "Publier l'article"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
