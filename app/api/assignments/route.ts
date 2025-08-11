import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { user_id, agent_id } = await req.json()

    if (!user_id || !agent_id) {
      return NextResponse.json(
        { error: 'user_id y agent_id son requeridos' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con cookies para autenticación
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No necesitamos set en este contexto
          },
          remove(name: string, options: any) {
            // No necesitamos remove en este contexto
          },
        },
      }
    )

    // Verificar que el usuario esté autenticado y sea admin
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden crear asignaciones.' },
        { status: 403 }
      )
    }

    // Crear la asignación usando el cliente autenticado
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        user_id,
        agent_id,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('Error creando asignación:', assignmentError)
      return NextResponse.json(
        { error: `Error al crear asignación: ${assignmentError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignment
    })

  } catch (error: any) {
    console.error('Error en API de asignaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Crear cliente de Supabase con cookies para autenticación
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No necesitamos set en este contexto
          },
          remove(name: string, options: any) {
            // No necesitamos remove en este contexto
          },
        },
      }
    )

    // Verificar que el usuario esté autenticado y sea admin
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden ver asignaciones.' },
        { status: 403 }
      )
    }

    // Obtener asignaciones con joins
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        profiles!assignments_user_id_fkey(id, full_name, email),
        agents!assignments_agent_id_fkey(id, name, description)
      `)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error obteniendo asignaciones:', assignmentsError)
      return NextResponse.json(
        { error: `Error al obtener asignaciones: ${assignmentsError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignments
    })

  } catch (error: any) {
    console.error('Error en API de asignaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user_id, agent_id } = await req.json()

    if (!user_id || !agent_id) {
      return NextResponse.json(
        { error: 'user_id y agent_id son requeridos' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con cookies para autenticación
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No necesitamos set en este contexto
          },
          remove(name: string, options: any) {
            // No necesitamos remove en este contexto
          },
        },
      }
    )

    // Verificar que el usuario esté autenticado y sea admin
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden eliminar asignaciones.' },
        { status: 403 }
      )
    }

    // Eliminar la asignación
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('user_id', user_id)
      .eq('agent_id', agent_id)

    if (deleteError) {
      console.error('Error eliminando asignación:', deleteError)
      return NextResponse.json(
        { error: `Error al eliminar asignación: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    })

  } catch (error: any) {
    console.error('Error en API de asignaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
