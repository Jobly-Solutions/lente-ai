import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const supabaseAnon = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.full_name || 'Sin nombre',
      role: user.role,
      status: 'active', // All users in profiles are active
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }))

    return NextResponse.json(transformedUsers)

  } catch (error) {
    console.error('Error in users GET API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email: rawEmail, password, name, role } = body
    const email = (rawEmail || '').trim().toLowerCase()

    // Validar datos requeridos
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password y nombre son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // 1. Crear usuario en Supabase Auth usando la misma lógica que funciona en el script de prueba
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: role || 'user',
      },
    })

    if (authError) {
      console.error('Error creating auth user:', {
        supabaseUrl,
        message: (authError as any)?.message,
        status: (authError as any)?.status,
        name: (authError as any)?.name,
      })

      // Fallback 1: intentar localizar el usuario por email (paginando) y continuar si existe
      try {
        let existing: any | null = null
        for (let page = 1; page <= 10 && !existing; page++) {
          const list = await supabase.auth.admin.listUsers({ page, perPage: 100 } as any)
          const candidates = list?.data?.users || []
          existing = candidates.find((u: any) => (u?.email || '').toLowerCase() === email) || null
          if (candidates.length < 100) break
        }
        if (existing) {
          // Asegurar que el usuario pueda iniciar sesión: actualizar password y confirmar email
          try {
            await supabase.auth.admin.updateUserById(existing.id, {
              password,
              email_confirm: true as any,
              user_metadata: { full_name: name, role: role || 'user' },
            } as any)
          } catch (e: any) {
            console.warn('No se pudo actualizar password/metadata del usuario existente:', e?.message || e)
          }

          // El perfil ya existe por el trigger, solo actualizar si es necesario
          if (role === 'admin') {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ 
                role: 'admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)
            if (profileError) {
              console.error('Error updating profile role after fallback:', profileError)
              // No es crítico, continuar
            }
          }
          return NextResponse.json({
            success: true,
            user: { id: existing.id, email, name, role: role || 'user' },
            note: 'Usuario existente reutilizado y habilitado',
          })
        }
      } catch (e: any) {
        console.error('Fallback listUsers error:', e?.message || e)
      }

      // Fallback 2: intentar signUp con la anon key y luego forzar confirmación por admin (sin emails)
      try {
        if (supabaseAnon) {
          const { data: suData, error: suError } = await supabaseAnon.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, role: role || 'user' } },
          })
          if (!suError && suData?.user) {
            const createdUser = suData.user
            // Forzar confirmación y asegurar password vía admin
            try {
              await supabase.auth.admin.updateUserById(createdUser.id, {
                password,
                email_confirm: true as any,
                user_metadata: { full_name: name, role: role || 'user' },
              } as any)
            } catch (e: any) {
              console.warn('No se pudo forzar confirmación del usuario creado por signUp:', e?.message || e)
            }
            // El perfil se crea automáticamente por el trigger, solo actualizar rol si es admin
            if (role === 'admin') {
              const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                  role: 'admin',
                  updated_at: new Date().toISOString()
                })
                .eq('id', createdUser.id)
              if (profileError) {
                console.error('Error updating profile role after signUp fallback:', profileError)
                // No es crítico, continuar
              }
            }
            return NextResponse.json({
              success: true,
              user: { id: createdUser.id, email, name, role: role || 'user' },
              note: 'Usuario creado con signUp y activado sin confirmación de email',
            })
          }
        }
      } catch (e: any) {
        console.error('Fallback signUp error:', e?.message || e)
      }

      // Removido: no enviar invitaciones por email; el usuario debe quedar activo sin confirmación
      return NextResponse.json(
        { error: `Error al crear el usuario: ${authError.message}. Verifica NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      )
    }

    // 2. El perfil se crea automáticamente por el trigger on_auth_user_created
    // Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Solo necesitamos actualizar el rol si es admin
    if (role === 'admin') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Error updating profile role:', profileError)
        // No es crítico, continuar
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: role || 'user'
      }
    })

  } catch (error) {
    console.error('Error in user creation API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
