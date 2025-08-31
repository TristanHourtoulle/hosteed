'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { ScrollArea } from '@/components/ui/shadcnui/scroll-area'
import { 
  HelpCircle, 
  Bold, 
  Italic, 
  List, 
  Link2, 
  Image as ImageIcon, 
  Code,
  Quote,
  Hash,
  Type,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'

interface ExampleProps {
  markdown: string
  description: string
  category: string
}

const examples: ExampleProps[] = [
  {
    category: 'Titres',
    markdown: '# Titre principal\n## Sous-titre\n### Titre de section',
    description: 'Utilisez # pour les titres. Plus il y a de #, plus le titre est petit.'
  },
  {
    category: 'Style du texte',
    markdown: '**Texte en gras**\n*Texte en italique*\n~~Texte barré~~',
    description: 'Mettez en forme votre texte avec des caractères spéciaux.'
  },
  {
    category: 'Listes',
    markdown: '- Premier élément\n- Deuxième élément\n  - Sous-élément\n\n1. Première étape\n2. Deuxième étape',
    description: 'Créez des listes à puces (-) ou numérotées (1.).'
  },
  {
    category: 'Liens',
    markdown: '[Texte du lien](https://example.com)\n[Email](mailto:contact@example.com)',
    description: 'Ajoutez des liens avec [texte](url).'
  },
  {
    category: 'Images',
    markdown: '![Description de l\'image](https://example.com/image.jpg)',
    description: 'Insérez des images avec ![description](url).'
  },
  {
    category: 'Code',
    markdown: '`code en ligne`\n\n```javascript\nconst message = "Hello World";\nconsole.log(message);\n```',
    description: 'Code en ligne avec ` ou blocs de code avec ```.'
  },
  {
    category: 'Citations',
    markdown: '> Ceci est une citation importante.\n> Elle peut être sur plusieurs lignes.',
    description: 'Utilisez > pour créer des citations.'
  },
  {
    category: 'Tableaux',
    markdown: '| Colonne 1 | Colonne 2 | Colonne 3 |\n|-----------|-----------|----------|\n| Donnée 1  | Donnée 2  | Donnée 3 |\n| Donnée 4  | Donnée 5  | Donnée 6 |',
    description: 'Créez des tableaux avec | pour séparer les colonnes.'
  }
]

const shortcuts = [
  { key: 'Ctrl+B', action: 'Gras', icon: Bold },
  { key: 'Ctrl+I', action: 'Italique', icon: Italic },
  { key: 'Ctrl+K', action: 'Lien', icon: Link2 },
  { key: 'Ctrl+`', action: 'Code', icon: Code },
  { key: 'Ctrl+Shift+.', action: 'Citation', icon: Quote },
]

export default function RichEditorGuide() {
  const [copiedExample, setCopiedExample] = useState<number | null>(null)

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedExample(index)
      setTimeout(() => setCopiedExample(null), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <HelpCircle className="w-4 h-4" />
          Guide d'écriture
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Type className="w-6 h-6 text-purple-600" />
            </div>
            Guide d'écriture Markdown
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="examples" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="examples">Exemples</TabsTrigger>
            <TabsTrigger value="shortcuts">Raccourcis</TabsTrigger>
            <TabsTrigger value="tips">Conseils</TabsTrigger>
          </TabsList>
          
          <TabsContent value="examples" className="mt-6">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <div className="text-sm text-slate-600 mb-4">
                  <p>Cliquez sur les exemples pour les copier dans votre presse-papiers !</p>
                </div>
                {examples.map((example, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => copyToClipboard(example.markdown, index)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Hash className="w-4 h-4 text-purple-600" />
                            {example.category}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <AnimatePresence mode="wait">
                              {copiedExample === index ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="flex items-center gap-1 text-green-600"
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="text-xs">Copié !</span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="copy"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600"
                                >
                                  <Copy className="w-4 h-4" />
                                  <span className="text-xs">Cliquer pour copier</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">{example.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm border">
                          <pre className="whitespace-pre-wrap text-slate-800">
                            {example.markdown}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="shortcuts" className="mt-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-6">
                Utilisez ces raccourcis clavier pour écrire plus rapidement :
              </p>
              <div className="grid gap-3">
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border">
                        <shortcut.icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="font-medium">{shortcut.action}</span>
                    </div>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-mono">
                      {shortcut.key}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="mt-6">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      Conseils de rédaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-blue-700">
                    <div className="space-y-3">
                      <p>• <strong>Utilisez des titres</strong> pour structurer votre article</p>
                      <p>• <strong>Aérez votre texte</strong> avec des paragraphes courts</p>
                      <p>• <strong>Ajoutez des images</strong> pour illustrer vos propos</p>
                      <p>• <strong>Utilisez des listes</strong> pour organiser les informations</p>
                      <p>• <strong>Prévisualisez</strong> toujours avant de publier</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      Astuces avancées
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-green-700">
                    <div className="space-y-3">
                      <p>• Vous pouvez utiliser du <strong>HTML</strong> directement dans votre Markdown</p>
                      <p>• Laissez une <strong>ligne vide</strong> entre les paragraphes</p>
                      <p>• Utilisez <code className="bg-white px-1 rounded">---</code> pour créer une ligne de séparation</p>
                      <p>• Les <strong>emojis</strong> sont supportés : 🎉 ✨ 📝</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-amber-800 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      Erreurs courantes à éviter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-amber-700">
                    <div className="space-y-3">
                      <p>• N'oubliez pas l'<strong>espace après #</strong> pour les titres</p>
                      <p>• Les <strong>liens</strong> doivent être au format [texte](url)</p>
                      <p>• Attention aux <strong>caractères spéciaux</strong> dans les URLs</p>
                      <p>• Vérifiez l'<strong>indentation</strong> pour les listes imbriquées</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}