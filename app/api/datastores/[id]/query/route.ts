import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })

    const body = await req.json()
    const res = await fetch(`${baseUrl}/datastores/${id}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


