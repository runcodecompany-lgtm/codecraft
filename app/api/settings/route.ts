import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' }
    })
    return NextResponse.json(settings || {})
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        ...body,
        updatedAt: new Date()
      },
      create: {
        id: 'default',
        ...body
      }
    })
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
