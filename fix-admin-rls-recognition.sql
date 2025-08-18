-- ========================================
-- FIX ADMIN RLS RECOGNITION
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar usuario actual y su rol
SELECT 'Current user and role:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    p.role as user_role,
    p.id as profile_id
FROM public.profiles p
WHERE p.id = auth.uid();

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

-- ========================================
-- VERIFICAR Y CORREGIR POLÍTICAS RLS
-- ========================================

-- Eliminar políticas existentes para agents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.agents;

-- Eliminar políticas existentes para assignments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.assignments;

-- ========================================
-- CREAR POLÍTICAS RLS SIMPLIFICADAS
-- ========================================

-- Políticas para agents - Versión simplificada
CREATE POLICY "Enable read access for authenticated users" ON public.agents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins only" ON public.agents
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable update for admins only" ON public.agents
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admins only" ON public.agents
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para assignments - Versión simplificada
CREATE POLICY "Enable read access for authenticated users" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins only" ON public.assignments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable update for admins only" ON public.assignments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admins only" ON public.assignments
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- VERIFICAR RLS HABILITADO
-- ========================================

-- Asegurar que RLS esté habilitado
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- TEST DE PERMISOS
-- ========================================

-- Test 1: Verificar que el usuario puede insertar agentes
SELECT 'Testing agent insert permission:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario puede insertar agentes (es admin)'
        ELSE '❌ Usuario NO puede insertar agentes (no es admin)'
    END as agent_insert_permission;

-- Test 2: Verificar que el usuario puede insertar asignaciones
SELECT 'Testing assignment insert permission:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN '✅ Usuario puede insertar asignaciones (es admin)'
        ELSE '❌ Usuario NO puede insertar asignaciones (no es admin)'
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
