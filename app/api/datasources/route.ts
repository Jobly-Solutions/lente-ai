import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })

    const contentType = req.headers.get('content-type') || ''

    // Multipart upload (file datasource)
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const forward = new FormData()
      // Required fields per docs
      const file = form.get('file') as File | null
      const datastoreId = form.get('datastoreId') as string | null
      const type = form.get('type') as string | null
      const fileName = (form.get('fileName') as string) || (file as any)?.name || 'upload'
      const custom_id = form.get('custom_id') as string | null
      if (!file || !datastoreId || !type) {
        return NextResponse.json({ error: 'Missing file/type/datastoreId' }, { status: 400 })
      }
      forward.append('file', file, fileName)
      forward.append('fileName', fileName)
      forward.append('type', type)
      forward.append('datastoreId', datastoreId)
      if (custom_id) forward.append('custom_id', custom_id)

      const res = await fetch(`${baseUrl}/datasources`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: forward,
        cache: 'no-store',
      })
      const text = await res.text()
      if (!res.ok) {
        console.error('Datasource upload error:', res.status, text)
      }
      return new NextResponse(text, { status: res.status })
    }

    // JSON payload (web_page / web_site)
    const body = await req.json()
    const res = await fetch(`${baseUrl}/datasources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
    })
    const text = await res.text()
    if (!res.ok) {
      console.error('Datasource create (json) error:', res.status, text)
    }
    return new NextResponse(text, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


