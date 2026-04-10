'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  ImagePlus,
  X,
  FileText,
  Eye,
  Edit3,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import SEOFieldsCard, { type SEOData } from '@/components/ui/SEOFieldsCard'
import {
  LazyMarkdownEditor,
  LazyMarkdownViewer,
} from '@/components/dynamic/LazyComponents'
import { PageHeader } from '@/components/admin/ui/PageHeader'

/**
 * Form data emitted to the parent on submit. Image handling is the parent's
 * responsibility — it can upload/convert the `newImageFile` to base64, or reuse
 * the `imageUrl` when the user didn't touch the image picker.
 */
export interface BlogPostFormData {
  title: string
  content: string
  seoData: SEOData
  /** New file picked by the user, or null if unchanged. */
  newImageFile: File | null
  /** URL/base64 of the currently displayed image, or empty string if cleared. */
  imageUrl: string
}

interface BlogPostFormProps {
  mode: 'create' | 'edit'
  /** PageHeader back link href. */
  backHref: string
  backLabel?: string
  /** Eyebrow pill text above the title. */
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  /** Large page title. */
  pageTitle: string
  /** Subtitle under the page title. */
  pageSubtitle?: string

  /** Initial title value. */
  initialTitle?: string
  /** Initial markdown content. */
  initialContent?: string
  /** Initial image URL (for edit mode). */
  initialImageUrl?: string
  /** Initial SEO data. */
  initialSeoData?: SEOData

  /** Whether an image is required to submit (create mode usually requires one). */
  imageRequired?: boolean

  /** Label for the primary submit button. */
  submitLabel?: string
  /** Label shown on the submit button while in flight. */
  submittingLabel?: string

  /** Extra sidebar slot (e.g. post info card on edit). */
  sidebarExtra?: React.ReactNode
  /** Extra actions slot in the page header (e.g. "Aperçu" link). */
  headerActions?: React.ReactNode

  /** Called when the user submits the form. Return a promise — while it's
   *  resolving, the submit button shows the loading state. */
  onSubmit: (data: BlogPostFormData) => Promise<void>
}

export function BlogPostForm({
  mode,
  backHref,
  backLabel = 'Retour',
  eyebrow,
  eyebrowIcon,
  pageTitle,
  pageSubtitle,
  initialTitle = '',
  initialContent = '',
  initialImageUrl = '',
  initialSeoData,
  imageRequired = mode === 'create',
  submitLabel,
  submittingLabel,
  sidebarExtra,
  headerActions,
  onSubmit,
}: BlogPostFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState(initialImageUrl)
  const [seoData, setSeoData] = useState<SEOData>(
    initialSeoData ?? { metaTitle: '', metaDescription: '', keywords: '', slug: '' }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewUrl = newImageFile ? URL.createObjectURL(newImageFile) : imageUrl
  const hasImage = Boolean(previewUrl)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewImageFile(file)
  }

  const handleImageRemove = () => {
    setNewImageFile(null)
    setImageUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Le titre de l'article est requis")
      return
    }
    if (!content.trim()) {
      toast.error('Le contenu est requis')
      return
    }
    if (imageRequired && !hasImage) {
      toast.error("Une image de couverture est requise")
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({ title, content, seoData, newImageFile, imageUrl })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.form
        onSubmit={handleSubmit}
        className='mx-auto max-w-6xl space-y-8 p-6'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          backHref={backHref}
          backLabel={backLabel}
          eyebrow={eyebrow}
          eyebrowIcon={eyebrowIcon}
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={
            <div className='flex items-center gap-2'>
              {headerActions}
              <Button
                type='submit'
                disabled={isSubmitting}
                className='gap-2'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {submittingLabel ?? 'Enregistrement…'}
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4' />
                    {submitLabel ?? (mode === 'create' ? "Publier l'article" : 'Sauvegarder')}
                  </>
                )}
              </Button>
            </div>
          }
        />

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Left column — title + content */}
          <div className='space-y-6 lg:col-span-2'>
            {/* Title card */}
            <div className='rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
              <div className='flex items-center gap-3 border-b border-slate-100 px-6 py-4'>
                <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                  <FileText className='h-4 w-4' />
                </div>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>
                    Titre de l&apos;article
                  </h2>
                </div>
              </div>
              <div className='p-6'>
                <Label htmlFor='blog-title' className='sr-only'>
                  Titre
                </Label>
                <Input
                  id='blog-title'
                  placeholder='Un titre captivant pour votre article…'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className='h-12 text-lg font-medium'
                />
                <p className='mt-2 text-xs text-slate-500'>
                  Un bon titre est clair, concis et donne envie de cliquer.
                </p>
              </div>
            </div>

            {/* Content editor card */}
            <div className='rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
              <div className='flex items-center gap-3 border-b border-slate-100 px-6 py-4'>
                <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600'>
                  <Edit3 className='h-4 w-4' />
                </div>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>
                    Contenu
                  </h2>
                </div>
              </div>
              <div className='p-6'>
                <Tabs defaultValue='edit' className='w-full'>
                  <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger value='edit' className='gap-2'>
                      <Edit3 className='h-3.5 w-3.5' />
                      Édition
                    </TabsTrigger>
                    <TabsTrigger value='preview' className='gap-2'>
                      <Eye className='h-3.5 w-3.5' />
                      Aperçu
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value='edit' className='mt-4'>
                    <div
                      data-color-mode='light'
                      className='overflow-hidden rounded-xl border border-slate-200 bg-white'
                    >
                      <LazyMarkdownEditor
                        value={content}
                        onChange={val => setContent(val || '')}
                        preview='edit'
                        height={460}
                        data-color-mode='light'
                        visibleDragbar={false}
                        textareaProps={{
                          placeholder:
                            "Commencez à écrire votre article ici…\n\n# Titre principal\n\nVotre contenu. Utilisez **gras** et *italique* pour mettre en forme.\n\n## Sous-titre\n\n- Liste à puces\n- Deuxième élément\n\n[Lien](https://example.com)",
                        }}
                      />
                    </div>
                    <p className='mt-3 text-xs text-slate-500'>
                      La syntaxe Markdown est prise en charge (titres, listes, liens, images,
                      code…).
                    </p>
                  </TabsContent>
                  <TabsContent value='preview' className='mt-4'>
                    <div className='min-h-[460px] rounded-xl border border-slate-200 bg-white p-6'>
                      <div data-color-mode='light' className='prose prose-sm max-w-none'>
                        <LazyMarkdownViewer
                          source={content || '*Votre article apparaîtra ici…*'}
                          style={{ backgroundColor: 'transparent', fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Right column — sidebar */}
          <div className='space-y-6'>
            {/* Cover image card */}
            <div className='rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
              <div className='flex items-center gap-3 border-b border-slate-100 px-6 py-4'>
                <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600'>
                  <ImagePlus className='h-4 w-4' />
                </div>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>
                    Image de couverture
                    {imageRequired && <span className='ml-1 text-red-500'>*</span>}
                  </h2>
                </div>
              </div>
              <div className='space-y-4 p-6'>
                {hasImage ? (
                  <div className='relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100'>
                    <Image
                      src={previewUrl}
                      alt='Image de couverture'
                      fill
                      className='object-cover'
                      sizes='(max-width: 1024px) 100vw, 400px'
                      unoptimized
                    />
                    <button
                      type='button'
                      onClick={handleImageRemove}
                      className='absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm transition hover:bg-white hover:text-red-700'
                      aria-label='Retirer l’image'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                ) : (
                  <button
                    type='button'
                    onClick={() => document.getElementById('blog-image-upload')?.click()}
                    className='flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600'
                  >
                    <ImagePlus className='h-10 w-10' />
                    <p className='text-sm font-medium'>Ajouter une image</p>
                    <p className='text-xs'>Format recommandé : 1200 × 630 px</p>
                  </button>
                )}

                <Label htmlFor='blog-image-upload' className='sr-only'>
                  Image
                </Label>
                <Input
                  id='blog-image-upload'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
                />
              </div>
            </div>

            {/* SEO card */}
            <SEOFieldsCard
              seoData={seoData}
              onSeoChange={setSeoData}
              articleTitle={title}
            />

            {sidebarExtra}
          </div>
        </div>
      </motion.form>
    </div>
  )
}
