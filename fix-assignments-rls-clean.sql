-- ========================================
-- FIX RLS POLICIES FOR ASSIGNMENTS TABLE (CLEAN VERSION)
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar políticas actuales
SELECT 'Current policies for assignments table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'assignments';

-- ========================================
-- ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ========================================

-- Eliminar TODAS las políticas existentes para assignments
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assignments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.assignments;

-- ========================================
-- CREAR POLÍTICAS CORRECTAS
-- ========================================

-- Política para SELECT - solo usuarios autenticados pueden ver asignaciones
CREATE POLICY "Enable read access for authenticated users" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT - solo usuarios autenticados pueden crear asignaciones
CREATE POLICY "Enable insert for authenticated users" ON public.assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE - solo usuarios autenticados pueden actualizar asignaciones
CREATE POLICY "Enable update for authenticated users" ON public.assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE - solo usuarios autenticados pueden eliminar asignaciones
CREATE POLICY "Enable delete for authenticated users" ON public.assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- VERIFICAR POLÍTICAS DESPUÉS DEL FIX
-- ========================================

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
    RAISE NOTICE '✅ Políticas RLS para assignments actualizadas exitosamente!';
    RAISE NOTICE '📝 SELECT: Solo usuarios autenticados';
    RAISE NOTICE '📝 INSERT: Solo usuarios autenticados';
    RAISE NOTICE '📝 UPDATE: Solo usuarios autenticados';
    RAISE NOTICE '📝 DELETE: Solo usuarios autenticados';
    RAISE NOTICE '🔒 Ahora las operaciones requieren autenticación';
    RAISE NOTICE '🎯 Las asignaciones deberían funcionar correctamente';
END $$;
