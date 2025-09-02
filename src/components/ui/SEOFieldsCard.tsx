'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Textarea } from '@/components/ui/shadcnui/textarea'
import { Badge } from '@/components/ui/shadcnui/badge'
import { 
  Search, 
  Globe, 
  Tag, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  Smartphone,
  Monitor
} from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'

interface SEOData {
  metaTitle: string
  metaDescription: string
  keywords: string
  slug: string
}

interface SEOFieldsCardProps {
  seoData: SEOData
  onSeoChange: (data: SEOData) => void
  articleTitle: string
}

export default function SEOFieldsCard({ seoData, onSeoChange, articleTitle }: SEOFieldsCardProps) {

  const handleChange = (field: keyof SEOData, value: string) => {
    onSeoChange({
      ...seoData,
      [field]: value
    })
  }

  // Auto-generate slug from title
  const generateSlug = () => {
    const slug = articleTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    handleChange('slug', slug)
  }

  const getMetaTitleStatus = () => {
    const length = seoData.metaTitle.length
    if (length === 0) return { status: 'empty', color: 'text-slate-400', message: 'Titre non renseigné' }
    if (length < 30) return { status: 'short', color: 'text-orange-600', message: 'Trop court (30-60 caractères recommandés)' }
    if (length > 60) return { status: 'long', color: 'text-red-600', message: 'Trop long (60 caractères max recommandés)' }
    return { status: 'good', color: 'text-green-600', message: 'Longueur optimale' }
  }

  const getMetaDescriptionStatus = () => {
    const length = seoData.metaDescription.length
    if (length === 0) return { status: 'empty', color: 'text-slate-400', message: 'Description non renseignée' }
    if (length < 120) return { status: 'short', color: 'text-orange-600', message: 'Trop courte (120-160 caractères recommandés)' }
    if (length > 160) return { status: 'long', color: 'text-red-600', message: 'Trop longue (160 caractères max recommandés)' }
    return { status: 'good', color: 'text-green-600', message: 'Longueur optimale' }
  }

  const titleStatus = getMetaTitleStatus()
  const descriptionStatus = getMetaDescriptionStatus()

  const SearchPreview = ({ device }: { device: 'desktop' | 'mobile' }) => (
    <div className={`border rounded-lg p-4 bg-white ${device === 'mobile' ? 'max-w-sm' : 'max-w-xl'}`}>
      <div className="space-y-1">
        <h3 className={`text-blue-600 hover:underline cursor-pointer ${device === 'mobile' ? 'text-sm' : 'text-lg'}`}>
          {seoData.metaTitle || articleTitle || 'Titre de votre article'}
        </h3>
        <p className={`text-green-700 ${device === 'mobile' ? 'text-xs' : 'text-sm'}`}>
          https://hosteed.com/posts/{seoData.slug || 'votre-article'}
        </p>
        <p className={`text-slate-600 ${device === 'mobile' ? 'text-xs' : 'text-sm'} leading-relaxed`}>
          {seoData.metaDescription || 'Découvrez cet article passionnant sur notre plateforme...'}
        </p>
      </div>
    </div>
  )

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Search className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              Référencement SEO
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Recommandé
              </Badge>
            </div>
            <p className="text-sm text-slate-600 font-normal mt-1">
              Optimisez la visibilité de votre article dans les moteurs de recherche
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.div 
          className="grid md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            {/* Meta Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle" className="flex items-center gap-2 text-base font-medium">
                  <Globe className="w-4 h-4 text-purple-600" />
                  Titre SEO
                </Label>
                <div className="flex items-center gap-2">
                  {titleStatus.status === 'good' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  )}
                  <span className={`text-xs ${titleStatus.color}`}>
                    {seoData.metaTitle.length}/60
                  </span>
                </div>
              </div>
              <Input
                id="metaTitle"
                placeholder={articleTitle || "Titre optimisé pour les moteurs de recherche..."}
                value={seoData.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                className="focus:border-purple-300 focus:ring-purple-200"
              />
              <p className={`text-xs ${titleStatus.color}`}>
                {titleStatus.message}
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription" className="flex items-center gap-2 text-base font-medium">
                  <Tag className="w-4 h-4 text-purple-600" />
                  Description SEO
                </Label>
                <div className="flex items-center gap-2">
                  {descriptionStatus.status === 'good' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  )}
                  <span className={`text-xs ${descriptionStatus.color}`}>
                    {seoData.metaDescription.length}/160
                  </span>
                </div>
              </div>
              <Textarea
                id="metaDescription"
                placeholder="Description claire et engageante de votre article pour les résultats de recherche..."
                value={seoData.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                className="resize-none focus:border-purple-300 focus:ring-purple-200"
                rows={3}
              />
              <p className={`text-xs ${descriptionStatus.color}`}>
                {descriptionStatus.message}
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="flex items-center gap-2 text-base font-medium">
                <Tag className="w-4 h-4 text-purple-600" />
                Mots-clés
              </Label>
              <Input
                id="keywords"
                placeholder="voyage, madagascar, hébergement, écotourisme..."
                value={seoData.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                className="focus:border-purple-300 focus:ring-purple-200"
              />
              <p className="text-xs text-slate-600">
                Séparez les mots-clés par des virgules. 3-5 mots-clés recommandés.
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug" className="flex items-center gap-2 text-base font-medium">
                  <Globe className="w-4 h-4 text-purple-600" />
                  URL de l&apos;article
                </Label>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={generateSlug}
                  disabled={!articleTitle}
                  className="text-xs"
                >
                  Auto-générer
                </Button>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-l-md border border-r-0">
                  hosteed.com/posts/
                </span>
                <Input
                  id="slug"
                  placeholder="mon-article-genial"
                  value={seoData.slug}
                  onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="rounded-l-none focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                Aperçu dans Google
              </h3>
            </div>
            
            <Tabs defaultValue="desktop" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="desktop" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Desktop
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Mobile
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="desktop" className="mt-4">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <SearchPreview device="desktop" />
                </div>
              </TabsContent>
              
              <TabsContent value="mobile" className="mt-4">
                <div className="bg-slate-50 p-4 rounded-lg border flex justify-center">
                  <SearchPreview device="mobile" />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}