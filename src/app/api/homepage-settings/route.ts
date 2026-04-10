import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const canManageSettings = ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles as string)
    if (!canManageSettings) {
      console.warn(
        `[PUT /api/homepage-settings] forbidden: user=${session.user.id} role=${session.user.roles}`
      )
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { heroBackgroundImage, howItWorksImage, authBackgroundImage } = body

    const updatedSettings = await updateHomepageSettings({
      heroBackgroundImage,
      howItWorksImage,
      authBackgroundImage,
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
