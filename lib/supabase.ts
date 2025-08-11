import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'lente-ai-auth-token',
    flowType: 'pkce',
  },
})

// Types for our database schema
export interface Profile {
  id: string
  email: string
  full_name?: string
  company?: string
  role: 'admin' | 'user'
  avatar_url?: string
  branding?: any
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  agent_id: string
  name: string
  description?: string
  welcome_message?: string
  context?: string
  is_active: boolean
  is_shared: boolean
  user_id?: string
  created_at: string
  updated_at: string
}

export interface Assignment {
  user_id: string
  agent_id: string
  assigned_at: string
}

export interface Conversation {
  id: string
  user_id: string
  agent_id: string
  conversation_id: string
  messages: any[]
  created_at: string
  updated_at: string
}

export interface ScoutConfig {
  id: string
  api_key: string
  default_agent_id?: string
  welcome_message?: string
  context?: string
}
