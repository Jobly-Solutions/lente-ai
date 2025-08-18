-- ========================================
-- FIX ALL RLS POLICIES (AGENTS + ASSIGNMENTS)
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar políticas actuales
SELECT 'Current policies for agents table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'agents';

SELECT 'Current policies for assignments table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'assignments';

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

-- Eliminar políticas para assignments
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assignments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.assignments;

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
-- VERIFICAR POLÍTICAS DESPUÉS DEL FIX
-- ========================================

SELECT 'Updated policies for agents table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

SELECT 'Updated policies for assignments table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- ========================================
-- CONFIRMACIÓN
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ TODAS las políticas RLS han sido actualizadas exitosamente!';
    RAISE NOTICE '📋 Tablas actualizadas: agents, assignments';
    RAISE NOTICE '📝 Operaciones habilitadas: SELECT, INSERT, UPDATE, DELETE';
    RAISE NOTICE '🔒 Requisito: Usuario autenticado con rol admin';
    RAISE NOTICE '🎯 Ahora deberías poder:';
    RAISE NOTICE '   • Crear agentes locales (solo admins)';
    RAISE NOTICE '   • Crear asignaciones (solo admins)';
    RAISE NOTICE '   • Ver y gestionar datos (usuarios autenticados)';
    RAISE NOTICE '⚠️  IMPORTANTE: Asegúrate de estar logueado como admin';
    RAISE NOTICE '⚠️  IMPORTANTE: Verifica que tu perfil tenga role = "admin"';
END $$;
