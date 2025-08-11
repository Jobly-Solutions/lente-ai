import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })
    const res = await fetch(`${baseUrl}/datasources/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })
    const res = await fetch(`${baseUrl}/datasources/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    })
    const text = await res.text()
    return new NextResponse(text, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


