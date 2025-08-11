'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from './supabase'
import { createBrowserClient } from '@supabase/ssr'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, company?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Create a browser client with cookie support for better persistence
  const browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let mounted = true

    // Get initial session with better persistence
    const initSession = async () => {
      try {
        console.log('🔄 Inicializando sesión...')
        
        // Try to get session from both storage and cookies
        const { data: { session } } = await browserClient.auth.getSession()
        
        if (!mounted) return
        
        console.log('📱 Sesión inicial:', session ? 'Encontrada' : 'No encontrada')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 Usuario encontrado:', session.user.email)
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Shorter timeout for better UX
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('⏰ Timeout de inicialización, forzando completado')
        setLoading(false)
      }
    }, 3000)

    initSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = browserClient.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('🔄 Auth state change:', event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fire-and-forget profile fetch; don't block auth loading
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId: string) {
    if (profileLoading) return // Prevent multiple simultaneous requests
    
    console.log('👤 Buscando perfil para usuario:', userId)
    setProfileLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('❌ Error obteniendo perfil:', error)
        // Auto-create profile if missing
        const sessionUser = (await supabase.auth.getUser()).data.user
        if (sessionUser) {
          const email = sessionUser.email as string
          const full_name = (sessionUser.user_metadata as any)?.full_name || email?.split('@')[0]
          const role = email?.toLowerCase() === 'jc.falcon@lenteconsulting.com' ? 'admin' : 'user'
          const { data: created, error: insErr } = await supabase
            .from('profiles')
            .insert({ id: userId, email, full_name, role })
            .select('*')
            .limit(1)
          if (!insErr && created && created.length > 0) {
            setProfile(created[0] as any)
          } else {
            // Fallback: try to read any existing row
            const { data: fallback } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .limit(1)
            if (fallback && fallback.length > 0) {
              setProfile(fallback[0] as any)
            }
          }
        }
        return
      }

      console.log('✅ Perfil encontrado:', data.role)
      setProfile(data)
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error)
      // Don't set profile to null on error, keep existing profile
    } finally {
      setProfileLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    console.log('🔐 Intentando login para:', email)
    const { data, error } = await browserClient.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ Error de login:', error.message)
    } else {
      console.log('✅ Login exitoso:', data.user?.email)
    }
    
    return { error }
  }

  async function signUp(email: string, password: string, fullName: string, company?: string) {
    const { error } = await browserClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company,
        },
      },
    })
    return { error }
  }

  async function signOut() {
    await browserClient.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
  }

  const value = {
    user,
    profile,
    session,
    loading, // do not block UI on profile loading
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
