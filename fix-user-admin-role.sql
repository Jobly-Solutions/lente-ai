-- ========================================
-- FIX USER ADMIN ROLE
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar usuario actual
SELECT 'Current user information:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- Verificar perfil del usuario actual
SELECT 'Current user profile:' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- Verificar si el usuario es admin
SELECT 'Admin status check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario ES admin'
        ELSE '❌ Usuario NO es admin'
    END as admin_status;

-- ========================================
-- ASIGNAR ROL DE ADMIN AL USUARIO ACTUAL
-- ========================================

-- Opción 1: Asignar admin al usuario actual
UPDATE public.profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE id = auth.uid();

-- Verificar el cambio
SELECT 'After role update:' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- Verificar permisos de inserción después del cambio
SELECT 'INSERT permissions after role update:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario puede insertar agentes (es admin)'
        ELSE '❌ Usuario NO puede insertar agentes (no es admin)'
    END as agents_insert_permission;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario puede insertar asignaciones (es admin)'
        ELSE '❌ Usuario NO puede insertar asignaciones (no es admin)'
    END as assignments_insert_permission;

-- ========================================
-- ALTERNATIVA: ASIGNAR ADMIN A EMAIL ESPECÍFICO
-- ========================================

-- Opción 2: Asignar admin a email específico (descomenta si necesitas)
-- UPDATE public.profiles 
-- SET 
--     role = 'admin',
--     updated_at = NOW()
-- WHERE email = 'tu-email@ejemplo.com';

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Listar todos los usuarios admin
SELECT 'All admin users:' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

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
