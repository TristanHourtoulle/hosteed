import { NextRequest, NextResponse } from 'next/server'
import {
  getHomepageSettings,
  updateHomepageSettings,
} from '@/lib/services/homepageSettings.service'

export async function GET() {
  try {
    const settings = await getHomepageSettings()
    return NextResponse.json(settings || {})
  } catch (error) {
    console.error('Error fetching homepage settings:', error)
    return NextResponse.json({ error: 'Failed to fetch homepage settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { heroBackgroundImage, howItWorksImage } = body

    const updatedSettings = await updateHomepageSettings({
      heroBackgroundImage,
      howItWorksImage,
    })

    if (!updatedSettings) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating homepage settings:', error)
    return NextResponse.json({ error: 'Failed to update homepage settings' }, { status: 500 })
  }
}
