import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, agentId, conversationId, role, content } = body || {}
    if (!userId || !agentId || !conversationId || !role || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Ensure conversation exists
    // Save message to conversations table (append to messages JSONB)
    const { data: existing, error: getErr } = await supabase
      .from('conversations')
      .select('id, messages')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .eq('conversation_id', conversationId)
      .limit(1)

    const msg = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    }

    if (getErr) {
      return NextResponse.json({ error: getErr.message }, { status: 500 })
    }

    if (!existing || existing.length === 0) {
      const { error: insErr } = await supabase.from('conversations').insert({
        user_id: userId,
        agent_id: agentId,
        conversation_id: conversationId,
        messages: [msg],
      })
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    } else {
      const current = existing[0]
      const updated = Array.isArray(current.messages) ? [...current.messages, msg] : [msg]
      const { error: updErr } = await supabase
        .from('conversations')
        .update({ messages: updated })
        .eq('id', current.id)
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Save chat error:', err?.message || err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


