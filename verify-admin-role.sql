-- ========================================
-- VERIFICAR ROL DE ADMIN Y ESTADO DE AUTENTICACIÓN
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar usuario actual
SELECT 'Current authenticated user:' as info;
SELECT 
    auth.uid() as user_id,
    auth.role() as auth_role,
    auth.email() as email;

-- Verificar perfil del usuario actual
SELECT 'Current user profile:' as info;
SELECT 
    id,
    email,
    full_name,
    company,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- Verificar si el usuario es admin
SELECT 'Admin check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario ES admin'
        ELSE '❌ Usuario NO es admin'
    END as admin_status;

-- Verificar políticas RLS activas
SELECT 'Active RLS policies for agents:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

SELECT 'Active RLS policies for assignments:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- Verificar datos existentes
SELECT 'Existing agents count:' as info;
SELECT COUNT(*) as agents_count FROM public.agents;

SELECT 'Existing assignments count:' as info;
SELECT COUNT(*) as assignments_count FROM public.assignments;

-- ========================================
-- CONFIRMACIÓN
-- ========================================

DO $$
DECLARE
    user_role TEXT;
    is_admin BOOLEAN;
BEGIN
    -- Obtener rol del usuario
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Verificar si es admin
    is_admin := (user_role = 'admin');
    
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETO:';
    RAISE NOTICE '👤 Usuario ID: %', auth.uid();
    RAISE NOTICE '📧 Email: %', auth.email();
    RAISE NOTICE '🎭 Rol: %', COALESCE(user_role, 'NO ENCONTRADO');
    RAISE NOTICE '👑 Es Admin: %', CASE WHEN is_admin THEN 'SÍ' ELSE 'NO' END;
    
    IF is_admin THEN
        RAISE NOTICE '✅ ESTADO: Usuario tiene permisos de admin';
        RAISE NOTICE '🎯 Puede: Crear agentes, crear asignaciones, gestionar datos';
    ELSE
        RAISE NOTICE '❌ ESTADO: Usuario NO tiene permisos de admin';
        RAISE NOTICE '⚠️  Para solucionar:';
        RAISE NOTICE '   1. Verificar que el email sea: jc.falcon@lenteconsulting.com';
        RAISE NOTICE '   2. Ejecutar: UPDATE public.profiles SET role = "admin" WHERE id = auth.uid();';
        RAISE NOTICE '   3. O contactar al administrador del sistema';
    END IF;
END $$;
