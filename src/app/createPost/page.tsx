'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import MDEditor from '@uiw/react-md-editor'
import Image from 'next/image'
import { createPost } from '@/lib/services/post.service'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Button } from '@/components/ui/shadcnui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { ScrollArea } from '@/components/ui/shadcnui/scroll-area'
import { Badge } from '@/components/ui/shadcnui/badge'
import { 
  ImagePlus, 
  FileImage, 
  Save, 
  X, 
  Eye, 
  Edit3, 
  ArrowLeft, 
  Sparkles,
  BookOpen,
  Users,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichEditorGuide from '@/components/ui/RichEditorGuide'
import SEOFieldsCard from '@/components/ui/SEOFieldsCard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

interface SEOData {
  metaTitle: string
  metaDescription: string
  keywords: string
  slug: string
}

export default function CreatePostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [seoData, setSeoData] = useState<SEOData>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    slug: ''
  })
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImages([newImages[0]]) // Limit to 1 image
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
      const reader = new FileReader()
      reader.readAsDataURL(images[0])
      reader.onload = async () => {
        const base64Image = reader.result as string
        
        const newPost = await createPost(title, content, base64Image, seoData)
        
        if (newPost) {
          toast.success('Article créé avec succès !', {
            description: 'Votre article est maintenant en ligne avec optimisation SEO'
          })
          
          // Reset form
          setTitle('')
          setContent('')
          setImages([])
          setSeoData({
            metaTitle: '',
            metaDescription: '',
            keywords: '',
            slug: ''
          })
          
          // Redirect to the newly created article
          router.push(`/posts/article/${newPost.slug}`)
        } else {
          toast.error("Erreur lors de la création de l'article")
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la création de l'article")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <div className='container mx-auto py-8 px-4 max-w-6xl'>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800">
              <Link href="/posts" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour aux articles
              </Link>
            </Button>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Création d'article
              </div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-purple-700 to-indigo-700">
                Créer un nouvel article
              </h1>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Partagez vos expériences et conseils avec la communauté Hosteed
              </p>
            </div>
          </motion.div>

          {/* Main Form */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-4 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Edit3 className="w-6 h-6 text-purple-600" />
                      </div>
                      Rédaction de l'article
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Utilisez Markdown pour une mise en forme riche et professionnelle
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1">
                      <Users className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                    <RichEditorGuide />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Title */}
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-3"
                  >
                    <Label htmlFor="title" className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Titre de l'article
                    </Label>
                    <Input
                      id="title"
                      placeholder="Un titre captivant qui donne envie de lire..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="text-xl h-14 border-2 focus:border-purple-300 focus:ring-purple-200 bg-white"
                    />
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Un bon titre augmente de 73% l'engagement des lecteurs
                    </p>
                  </motion.div>

                  {/* Image */}
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-4"
                  >
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <FileImage className="w-5 h-5 text-purple-600" />
                      Image de couverture
                    </Label>
                    
                    {images.length === 0 ? (
                      <div 
                        className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center bg-purple-50/50 hover:bg-purple-50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <ImagePlus className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-purple-700 mb-2">
                          Ajoutez une image de couverture
                        </h3>
                        <p className="text-purple-600 mb-4">
                          Format recommandé : 1200x630px - JPG, PNG ou WebP
                        </p>
                        <Button type="button" variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                          <ImagePlus className="w-4 h-4 mr-2" />
                          Choisir une image
                        </Button>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-purple-200">
                          <Image
                            src={URL.createObjectURL(images[0])}
                            alt="Image de couverture"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-3 bg-white/80 hover:bg-white text-slate-700 hover:text-red-600"
                              onClick={() => setImages([])}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <ImagePlus className="w-4 h-4 mr-2" />
                          Changer l'image
                        </Button>
                      </div>
                    )}
                    
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </motion.div>

                  {/* Content Editor */}
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-purple-600" />
                        Contenu de l'article
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          Markdown
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          Prévisualisation en temps réel
                        </Badge>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="edit" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                        <TabsTrigger value="edit" className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4" />
                          Édition
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Prévisualisation
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="edit" className="mt-6">
                        <div 
                          data-color-mode="light" 
                          className="rounded-xl border-2 border-purple-200 overflow-hidden bg-white shadow-inner"
                        >
                          <MDEditor
                            value={content}
                            onChange={(value) => setContent(value || '')}
                            height={500}
                            preview="edit"
                            className="!border-none"
                            data-color-mode="light"
                            visibleDragbar={false}
                            textareaProps={{
                              placeholder: "Commencez à écrire votre article ici...\n\n# Mon premier titre\n\nVotre contenu ici. Utilisez **gras** et *italique* pour mettre en forme.\n\n## Sous-titre\n\n- Liste à puces\n- Deuxième élément\n\n[Lien vers Hosteed](https://hosteed.com)"
                            }}
                          />
                        </div>
                        <p className="text-sm text-slate-600 mt-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Utilisez le guide d'écriture pour découvrir toutes les possibilités du Markdown
                        </p>
                      </TabsContent>
                      
                      <TabsContent value="preview" className="mt-6">
                        <div className="rounded-xl border-2 border-slate-200 bg-white">
                          <ScrollArea className="h-[500px] w-full p-6">
                            <div data-color-mode="light" className="prose prose-lg max-w-none">
                              <MDEditor.Markdown 
                                source={content || '*Votre article apparaîtra ici...*'} 
                                style={{ 
                                  backgroundColor: 'transparent',
                                  fontFamily: 'inherit'
                                }}
                              />
                            </div>
                          </ScrollArea>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* SEO Section */}
          <motion.div variants={itemVariants}>
            <SEOFieldsCard 
              seoData={seoData}
              onSeoChange={setSeoData}
              articleTitle={title}
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="flex justify-center pt-4">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !content.trim() || images.length === 0}
              className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Publication en cours...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-3" />
                  Publier l'article
                </>
              )}
            </Button>
          </motion.div>

          {/* Tips Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2">
                      💡 Conseils pour un article réussi
                    </h3>
                    <ul className="text-amber-700 space-y-1 text-sm">
                      <li>• Utilisez des titres clairs pour structurer votre contenu</li>
                      <li>• Ajoutez des images pour illustrer vos propos</li>
                      <li>• Rédigez une méta-description engageante pour le SEO</li>
                      <li>• Prévisualisez votre article avant publication</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}