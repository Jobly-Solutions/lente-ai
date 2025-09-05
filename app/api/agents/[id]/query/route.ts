import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    return NextResponse.json({ 
      message: 'Agent query endpoint is working', 
      agentId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    const body = await req.json()
    const { query, conversationId, streaming = false } = body

    console.log('Agent query request:', { agentId, query, conversationId, streaming })

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const baseUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
    const apiKey = process.env.BRAVILO_API_KEY

    console.log('API configuration:', { baseUrl, hasApiKey: !!apiKey })

    if (!apiKey) {
      return NextResponse.json({ error: 'BRAVILO_API_KEY not configured' }, { status: 500 })
    }

    // Prepare the request to Bravilo API
    const braviloPayload = {
      query,
      conversationId,
      streaming
    }

    console.log('Sending request to Bravilo:', `${baseUrl}/agents/${agentId}/query`)

    const response = await fetch(`${baseUrl}/agents/${agentId}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(braviloPayload),
      cache: 'no-store',
    })

    console.log('Bravilo response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Bravilo API error:', response.status, errorText)
      
      // If agent not found (404), return a fallback response
      if (response.status === 404) {
        return NextResponse.json({
          answer: 'Lo siento, no pude procesar tu consulta en este momento. El agente no está disponible o hay un problema de conectividad.',
          conversationId: agentId
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to query agent', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Bravilo response data:', data)
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Agent query error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}