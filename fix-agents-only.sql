-- ========================================
-- FIX AGENTS RLS POLICIES ONLY
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar políticas actuales para agents
SELECT 'Current policies for agents table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'agents';

-- ========================================
-- ELIMINAR POLÍTICAS EXISTENTES PARA AGENTS
-- ========================================

-- Eliminar TODAS las políticas existentes para agents
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Admins have full access to agents" ON public.agents;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.agents;

-- ========================================
-- CREAR POLÍTICAS CORRECTAS PARA AGENTS
-- ========================================

-- Política para SELECT - solo usuarios autenticados pueden ver agentes
CREATE POLICY "Enable read access for authenticated users" ON public.agents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT - solo usuarios autenticados pueden crear agentes
CREATE POLICY "Enable insert for authenticated users" ON public.agents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE - solo usuarios autenticados pueden actualizar agentes
CREATE POLICY "Enable update for authenticated users" ON public.agents
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE - solo usuarios autenticados pueden eliminar agentes
CREATE POLICY "Enable delete for authenticated users" ON public.agents
    FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- VERIFICAR POLÍTICAS DESPUÉS DEL FIX
-- ========================================

SELECT 'Updated policies for agents table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

-- ========================================
-- CONFIRMACIÓN
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS para agents actualizadas exitosamente!';
    RAISE NOTICE '📝 SELECT: Solo usuarios autenticados';
    RAISE NOTICE '📝 INSERT: Solo usuarios autenticados';
    RAISE NOTICE '📝 UPDATE: Solo usuarios autenticados';
    RAISE NOTICE '📝 DELETE: Solo usuarios autenticados';
    RAISE NOTICE '🔒 Ahora las operaciones requieren autenticación';
    RAISE NOTICE '🎯 Los agentes se podrán crear correctamente';
    RAISE NOTICE '⚠️  IMPORTANTE: Asegúrate de estar logueado en la aplicación';
END $$;
