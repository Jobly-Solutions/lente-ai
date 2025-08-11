import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function forward(method: 'PATCH' | 'PUT' | 'GET', req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })

    const { id } = await context.params
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Cache-Control': 'no-store',
    }

    let body: any = undefined
    if (method !== 'GET') {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = await req.json()
        body = JSON.stringify(json)
        headers['Content-Type'] = 'application/json'
      } else {
        // Fallback: forward raw text
        const text = await req.text()
        body = text
      }
    }

    const res = await fetch(`${baseUrl}/agents/${id}`, {
      method,
      headers,
      body,
      cache: 'no-store',
    })
    const text = await res.text()
    if (!res.ok) {
      console.error(`Agent ${method} error:`, res.status, text)
    }
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: res.status, headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return new NextResponse(text, { status: res.status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' } })
    }
  } catch (err: any) {
    console.error(`Agent ${method} proxy error:`, err?.message || err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return forward('PATCH', req, ctx)
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return forward('PUT', req, ctx)
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return forward('GET', req, ctx)
}


