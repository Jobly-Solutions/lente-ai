-- ========================================
-- DIAGNÓSTICO DE PROBLEMAS DE ASIGNACIONES
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar usuario actual y su rol
SELECT 'Current user and role:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    p.role as user_role
FROM public.profiles p
WHERE p.id = auth.uid();

-- Verificar si el usuario actual es admin
SELECT 'Admin check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario ES admin'
        ELSE '❌ Usuario NO es admin'
    END as admin_status;

-- Verificar estructura de tabla agents
SELECT 'Agents table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agents' 
ORDER BY ordinal_position;

-- Verificar estructura de tabla assignments
SELECT 'Assignments table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- Verificar RLS habilitado
SELECT 'RLS enabled status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('agents', 'assignments')
ORDER BY tablename;

-- Verificar políticas RLS para agents
SELECT 'RLS policies for agents:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

-- Verificar políticas RLS para assignments
SELECT 'RLS policies for assignments:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- Verificar agentes existentes
SELECT 'Existing agents:' as info;
SELECT 
    id,
    agent_id,
    name,
    description,
    is_active,
    user_id,
    created_at
FROM public.agents
ORDER BY created_at DESC
LIMIT 10;

-- Verificar asignaciones existentes
SELECT 'Existing assignments:' as info;
SELECT 
    user_id,
    agent_id,
    assigned_at
FROM public.assignments
ORDER BY assigned_at DESC
LIMIT 10;

-- Verificar usuarios disponibles
SELECT 'Available users:' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Verificar restricciones de clave foránea
SELECT 'Foreign key constraints:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('agents', 'assignments')
ORDER BY tc.table_name, kcu.column_name;

-- Verificar si hay datos huérfanos
SELECT 'Orphaned assignments (no user):' as info;
SELECT COUNT(*) as orphaned_assignments
FROM public.assignments a
LEFT JOIN public.profiles p ON a.user_id = p.id
WHERE p.id IS NULL;

SELECT 'Orphaned assignments (no agent):' as info;
SELECT COUNT(*) as orphaned_assignments
FROM public.assignments a
LEFT JOIN public.agents ag ON a.agent_id = ag.id
WHERE ag.id IS NULL;

-- Verificar permisos de inserción simulando una operación
SELECT 'Testing INSERT permissions for agents:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario puede insertar agentes (es admin)'
        ELSE '❌ Usuario NO puede insertar agentes (no es admin)'
    END as insert_permission;

SELECT 'Testing INSERT permissions for assignments:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario puede insertar asignaciones (es admin)'
        ELSE '❌ Usuario NO puede insertar asignaciones (no es admin)'
    END as insert_permission;
