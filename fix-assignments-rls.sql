-- ========================================
-- FIX ASSIGNMENTS AND AGENTS RLS POLICIES
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar estado actual de las políticas
SELECT 'Current RLS policies for agents:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

SELECT 'Current RLS policies for assignments:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- ========================================
-- ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ========================================

-- Eliminar políticas para agents
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Admins have full access to agents" ON public.agents;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.agents;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.agents;

-- Eliminar políticas para assignments
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assignments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.assignments;

-- ========================================
-- HABILITAR RLS EN AMBAS TABLAS
-- ========================================

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREAR POLÍTICAS CORRECTAS PARA AGENTS
-- ========================================

-- Política para SELECT: Usuarios autenticados pueden ver agentes
CREATE POLICY "Enable read access for authenticated users" ON public.agents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT: Solo admins pueden crear agentes
CREATE POLICY "Enable insert for admins only" ON public.agents
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para UPDATE: Solo admins pueden actualizar agentes
CREATE POLICY "Enable update for admins only" ON public.agents
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para DELETE: Solo admins pueden eliminar agentes
CREATE POLICY "Enable delete for admins only" ON public.agents
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- CREAR POLÍTICAS CORRECTAS PARA ASSIGNMENTS
-- ========================================

-- Política para SELECT: Usuarios autenticados pueden ver asignaciones
CREATE POLICY "Enable read access for authenticated users" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT: Solo admins pueden crear asignaciones
CREATE POLICY "Enable insert for admins only" ON public.assignments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para UPDATE: Solo admins pueden actualizar asignaciones
CREATE POLICY "Enable update for admins only" ON public.assignments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para DELETE: Solo admins pueden eliminar asignaciones
CREATE POLICY "Enable delete for admins only" ON public.assignments
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- VERIFICAR ESTRUCTURA DE TABLAS
-- ========================================

-- Verificar estructura de agents
SELECT 'Agents table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agents' 
ORDER BY ordinal_position;

-- Verificar estructura de assignments
SELECT 'Assignments table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAR DATOS EXISTENTES
-- ========================================

-- Verificar agentes existentes
SELECT 'Existing agents:' as info;
SELECT COUNT(*) as agents_count FROM public.agents;

-- Verificar asignaciones existentes
SELECT 'Existing assignments:' as info;
SELECT COUNT(*) as assignments_count FROM public.assignments;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Verificar políticas después del fix
SELECT 'Updated RLS policies for agents:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

SELECT 'Updated RLS policies for assignments:' as info;
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
