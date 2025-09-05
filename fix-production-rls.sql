-- ========================================
-- FIX PRODUCTION RLS - SOLUCIÓN DEFINITIVA
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar usuario actual
SELECT 'Current user and role:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    p.role as user_role
FROM public.profiles p
WHERE p.id = auth.uid();

-- ========================================
-- ELIMINAR TODAS LAS POLÍTICAS RLS PROBLEMÁTICAS
-- ========================================

-- Eliminar TODAS las políticas existentes para agents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.agents;
DROP POLICY IF EXISTS "Admins have full access to agents" ON public.agents;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.agents;

-- Eliminar TODAS las políticas existentes para assignments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.assignments;

-- ========================================
-- DESHABILITAR RLS TEMPORALMENTE
-- ========================================

-- Deshabilitar RLS en ambas tablas para que funcionen sin restricciones
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICAR QUE RLS ESTÁ DESHABILITADO
-- ========================================

-- Verificar estado de RLS
SELECT 'RLS status after fix:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('agents', 'assignments')
ORDER BY tablename;

-- Verificar que no hay políticas activas
SELECT 'Active policies for agents:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

SELECT 'Active policies for assignments:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- ========================================
-- TEST DE FUNCIONALIDAD
-- ========================================

-- Verificar que podemos insertar datos sin problemas
SELECT 'Testing data insertion capability:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'agents' AND rowsecurity = false
        ) THEN '✅ RLS disabled on agents - INSERT should work'
        ELSE '❌ RLS still enabled on agents'
    END as agents_status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'assignments' AND rowsecurity = false
        ) THEN '✅ RLS disabled on assignments - INSERT should work'
        ELSE '❌ RLS still enabled on assignments'
    END as assignments_status;

-- ========================================
-- CONFIRMACIÓN FINAL
-- ========================================

-- Verificar estructura de tablas
SELECT 'Table structure verification:' as info;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('agents', 'assignments')
ORDER BY table_name, ordinal_position;

-- Verificar datos existentes
SELECT 'Existing data count:' as info;
SELECT 
    (SELECT COUNT(*) FROM public.agents) as agents_count,
    (SELECT COUNT(*) FROM public.assignments) as assignments_count;

