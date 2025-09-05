import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    url: req.url
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return NextResponse.json({ 
    message: 'POST API is working',
    received: body,
    timestamp: new Date().toISOString()
  })
}
