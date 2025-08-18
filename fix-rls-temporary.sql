-- ========================================
-- TEMPORARY RLS FIX FOR FRONTEND
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
-- ELIMINAR POLÍTICAS RLS RESTRICTIVAS
-- ========================================

-- Eliminar todas las políticas existentes para agents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.agents;

-- Eliminar todas las políticas existentes para assignments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.assignments;

-- ========================================
-- CREAR POLÍTICAS RLS PERMISIVAS TEMPORALES
-- ========================================

-- Políticas para agents - Permitir a usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON public.agents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.agents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.agents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.agents
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para assignments - Permitir a usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- VERIFICAR RLS HABILITADO
-- ========================================

-- Asegurar que RLS esté habilitado
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- TEST DE PERMISOS
-- ========================================

-- Test 1: Verificar que cualquier usuario autenticado puede insertar agentes
SELECT 'Testing agent insert permission:' as info;
SELECT 
    CASE 
        WHEN auth.role() = 'authenticated' THEN '✅ Usuario puede insertar agentes (autenticado)'
        ELSE '❌ Usuario NO puede insertar agentes (no autenticado)'
    END as agent_insert_permission;

-- Test 2: Verificar que cualquier usuario autenticado puede insertar asignaciones
SELECT 'Testing assignment insert permission:' as info;
SELECT 
    CASE 
        WHEN auth.role() = 'authenticated' THEN '✅ Usuario puede insertar asignaciones (autenticado)'
        ELSE '❌ Usuario NO puede insertar asignaciones (no autenticado)'
    END as assignment_insert_permission;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Verificar políticas activas
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

-- Verificar RLS habilitado
SELECT 'RLS enabled status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('agents', 'assignments')
ORDER BY tablename;

-- ========================================
-- NOTA IMPORTANTE
-- ========================================

-- Esta es una solución temporal que permite a cualquier usuario autenticado
-- crear agentes y asignaciones. Para producción, deberías implementar
-- una solución más segura basada en roles específicos.

-- Para restaurar la seguridad más adelante, ejecuta:
-- 1. Verificar que el contexto de autenticación funciona correctamente
-- 2. Implementar políticas RLS basadas en roles específicos
-- 3. Usar middleware o validaciones adicionales en el frontend
