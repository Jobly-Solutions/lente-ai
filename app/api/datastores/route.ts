import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })

    const res = await fetch(`${baseUrl}/datastores`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Cache-Control': 'no-store',
      },
      cache: 'no-store',
    })
    const text = await res.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: res.status, headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return new NextResponse(text, { status: res.status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' } })
    }
  } catch (err: any) {
    console.error('Datastores proxy GET error:', err?.message || err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })

    const body = await req.json()
    const res = await fetch(`${baseUrl}/datastores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
    })
    const text = await res.text()
    // Try JSON, otherwise return raw text
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: res.status, headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return new NextResponse(text, { status: res.status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' } })
    }
  } catch (err: any) {
    console.error('Datastores proxy POST error:', err?.message || err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


