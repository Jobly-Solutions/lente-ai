import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId } = body || {}
    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })
    }

    const res = await fetch(`${baseUrl}/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ agentId }),
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status, headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    console.error('Proxy error (create chat session):', err?.message || err)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}


