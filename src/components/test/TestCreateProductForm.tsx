// Composant de test pour valider l'intégration Zod avec react-hook-form
'use client'

import { useCreateProductForm } from '@/hooks/useCreateProductForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function TestCreateProductForm() {
  const {
    form,
    formState,
    register,
    control,
    isLoading,
    globalError,
    selectedFiles,
    onSubmit,
    validateAndSetImages,
    clearGlobalError,
    errors,
  } = useCreateProductForm()

  return (
    <div className='container mx-auto p-6 max-w-4xl'>
      <Card>
        <CardHeader>
          <CardTitle>Test Formulaire de Création - Validation Zod</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='space-y-6'>
            {/* Erreur globale */}
            {globalError && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
                <p>{globalError}</p>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={clearGlobalError}
                  className='mt-2'
                >
                  Fermer
                </Button>
              </div>
            )}

            {/* Informations de base */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Nom de l'hébergement *</Label>
                <Input
                  id='name'
                  {...register('name')}
                  placeholder='Villa de charme avec vue mer...'
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className='text-sm text-red-600'>{errors.name.message}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='typeId'>Type d'hébergement *</Label>
                <Select
                  onValueChange={(value: string) =>
                    form.setValue('typeId', value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className={errors.typeId ? 'border-red-500' : ''}>
                    <SelectValue placeholder='Sélectionner un type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='type1'>Villa</SelectItem>
                    <SelectItem value='type2'>Appartement</SelectItem>
                    <SelectItem value='type3'>Maison</SelectItem>
                  </SelectContent>
                </Select>
                {errors.typeId && <p className='text-sm text-red-600'>{errors.typeId.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label htmlFor='description'>Description *</Label>
              <Textarea
                id='description'
                {...register('description')}
                placeholder='Décrivez votre hébergement en détail...'
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className='text-sm text-red-600'>{errors.description.message}</p>
              )}
            </div>

            {/* Adresse */}
            <div className='space-y-2'>
              <Label htmlFor='address'>Adresse *</Label>
              <Input
                id='address'
                {...register('address')}
                placeholder="Adresse complète de l'hébergement"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className='text-sm text-red-600'>{errors.address.message}</p>}
            </div>

            {/* Caractéristiques */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='room'>Chambres</Label>
                <Input
                  id='room'
                  {...register('room')}
                  type='number'
                  placeholder='Nombre'
                  className={errors.room ? 'border-red-500' : ''}
                />
                {errors.room && <p className='text-sm text-red-600'>{errors.room.message}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bathroom'>Salles de bain</Label>
                <Input
                  id='bathroom'
                  {...register('bathroom')}
                  type='number'
                  placeholder='Nombre'
                  className={errors.bathroom ? 'border-red-500' : ''}
                />
                {errors.bathroom && (
                  <p className='text-sm text-red-600'>{errors.bathroom.message}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='arriving'>Arrivée (h)</Label>
                <Input
                  id='arriving'
                  {...register('arriving')}
                  type='number'
                  min='0'
                  max='23'
                  placeholder='14'
                  className={errors.arriving ? 'border-red-500' : ''}
                />
                {errors.arriving && (
                  <p className='text-sm text-red-600'>{errors.arriving.message}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='leaving'>Départ (h)</Label>
                <Input
                  id='leaving'
                  {...register('leaving')}
                  type='number'
                  min='0'
                  max='23'
                  placeholder='12'
                  className={errors.leaving ? 'border-red-500' : ''}
                />
                {errors.leaving && <p className='text-sm text-red-600'>{errors.leaving.message}</p>}
              </div>
            </div>

            {/* Prix */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='basePrice'>Prix de base (€) *</Label>
                <Input
                  id='basePrice'
                  {...register('basePrice')}
                  type='number'
                  step='0.01'
                  placeholder='50.00'
                  className={errors.basePrice ? 'border-red-500' : ''}
                />
                {errors.basePrice && (
                  <p className='text-sm text-red-600'>{errors.basePrice.message}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='priceMGA'>Prix MGA *</Label>
                <Input
                  id='priceMGA'
                  {...register('priceMGA')}
                  type='number'
                  step='0.01'
                  placeholder='200000'
                  className={errors.priceMGA ? 'border-red-500' : ''}
                />
                {errors.priceMGA && (
                  <p className='text-sm text-red-600'>{errors.priceMGA.message}</p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>Options</h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='autoAccept'
                    checked={form.watch('autoAccept')}
                    onCheckedChange={(checked: boolean) =>
                      form.setValue('autoAccept', !!checked, { shouldValidate: true })
                    }
                  />
                  <Label htmlFor='autoAccept'>Acceptation automatique</Label>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='accessibility'
                    checked={form.watch('accessibility')}
                    onCheckedChange={(checked: boolean) =>
                      form.setValue('accessibility', !!checked, { shouldValidate: true })
                    }
                  />
                  <Label htmlFor='accessibility'>Accessible PMR</Label>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='petFriendly'
                    checked={form.watch('petFriendly')}
                    onCheckedChange={(checked: boolean) =>
                      form.setValue('petFriendly', !!checked, { shouldValidate: true })
                    }
                  />
                  <Label htmlFor='petFriendly'>Animaux acceptés</Label>
                </div>
              </div>
            </div>

            {/* État du formulaire */}
            <div className='bg-gray-50 p-4 rounded-md'>
              <h4 className='font-medium mb-2'>État de validation :</h4>
              <p className='text-sm'>
                Formulaire valide : {formState.isValid ? '✅ Oui' : '❌ Non'}
              </p>
              <p className='text-sm'>Nombre d'erreurs : {Object.keys(errors).length}</p>
              {Object.keys(errors).length > 0 && (
                <div className='mt-2'>
                  <p className='text-sm font-medium'>Erreurs :</p>
                  <ul className='text-xs text-red-600 list-disc list-inside'>
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>
                        {field}: {error?.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bouton de soumission */}
            <div className='flex justify-end space-x-4'>
              <Button type='button' variant='outline'>
                Annuler
              </Button>
              <Button
                type='submit'
                disabled={isLoading || !formState.isValid}
                className='min-w-[120px]'
              >
                {isLoading ? 'Création...' : "Créer l'annonce"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
