import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Save chat request:', body)
    const { userId, agentId, conversationId, role, content } = body || {}
    if (!userId || !agentId || !conversationId || !role || !content) {
      console.log('Missing fields:', { userId, agentId, conversationId, role, content })
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Ensure conversation exists
    // Save message to conversations table (append to messages JSONB)
    console.log('Checking for existing conversation...')
    const { data: existing, error: getErr } = await supabase
      .from('conversations')
      .select('id, messages')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .eq('conversation_id', conversationId)
      .limit(1)

    console.log('Existing conversation query result:', { existing, getErr })

    const msg = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    }

    if (getErr) {
      console.error('Error getting existing conversation:', getErr)
      return NextResponse.json({ error: getErr.message }, { status: 500 })
    }

    if (!existing || existing.length === 0) {
      console.log('Creating new conversation with message:', msg)
      const { error: insErr } = await supabase.from('conversations').insert({
        user_id: userId,
        agent_id: agentId,
        conversation_id: conversationId,
        messages: [msg],
      })
      if (insErr) {
        console.error('Error inserting new conversation:', insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
      console.log('New conversation created successfully')
    } else {
      const current = existing[0]
      const updated = Array.isArray(current.messages) ? [...current.messages, msg] : [msg]
      console.log('Updating existing conversation:', { currentId: current.id, updatedMessages: updated.length })
      const { error: updErr } = await supabase
        .from('conversations')
        .update({ messages: updated })
        .eq('id', current.id)
      if (updErr) {
        console.error('Error updating conversation:', updErr)
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
      console.log('Conversation updated successfully')
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Save chat error:', err?.message || err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


