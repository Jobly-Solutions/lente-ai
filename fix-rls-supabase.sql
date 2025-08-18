-- ========================================
-- FIX RLS POLICIES FOR AGENTS TABLE
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar políticas actuales
SELECT 'Current policies for agents table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'agents';

-- ========================================
-- AGREGAR POLÍTICA FALTANTE PARA INSERT
-- ========================================

-- Eliminar política si existe (para evitar duplicados)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.agents;

-- Crear nueva política para permitir INSERT a usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON public.agents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- También agregar política para UPDATE si no existe
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.agents;
CREATE POLICY "Enable update for authenticated users" ON public.agents
    FOR UPDATE USING (auth.role() = 'authenticated');

-- También agregar política para DELETE si no existe
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.agents;
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
    RAISE NOTICE '📝 INSERT: Habilitado para usuarios autenticados';
    RAISE NOTICE '📝 UPDATE: Habilitado para usuarios autenticados';
    RAISE NOTICE '📝 DELETE: Habilitado para usuarios autenticados';
    RAISE NOTICE '📝 SELECT: Ya estaba habilitado';
END $$;
