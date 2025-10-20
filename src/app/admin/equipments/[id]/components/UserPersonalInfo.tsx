'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { EquipmentInterface } from '@/lib/interface/equipmentInterface'
import { DynamicIcon } from '@/lib/utils/iconMapping'

export function UserPersonalInfo({ id, name, icon }: EquipmentInterface) {
  return (
    <Card className='lg:col-span-1 hover:shadow-lg transition-shadow duration-200'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl'>
          <DynamicIcon name={icon} className='h-5 w-5 text-blue-600' />
          Informations
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='text-gray-600'>ID:</span>
            <span className='font-medium'>{id || ''}</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-gray-600'>Nom:</span>
            <span className='font-medium'>{name || ''}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
