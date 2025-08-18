-- ========================================
-- CHECK RLS POLICIES STATUS
-- Ejecutar este script para verificar el estado actual
-- ========================================

-- Verificar políticas para agents
SELECT 'POLICIES FOR AGENTS TABLE:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'agents'
ORDER BY policyname;

-- Verificar políticas para assignments
SELECT 'POLICIES FOR ASSIGNMENTS TABLE:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- Verificar si RLS está habilitado en ambas tablas
SELECT 'RLS STATUS FOR TABLES:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('agents', 'assignments')
    AND schemaname = 'public';

-- Resumen
DO $$
DECLARE
    agents_count INTEGER;
    assignments_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agents_count 
    FROM pg_policies 
    WHERE tablename = 'agents';
    
    SELECT COUNT(*) INTO assignments_count 
    FROM pg_policies 
    WHERE tablename = 'assignments';
    
    RAISE NOTICE '📊 RESUMEN DE POLÍTICAS RLS:';
    RAISE NOTICE '   Agents: % políticas', agents_count;
    RAISE NOTICE '   Assignments: % políticas', assignments_count;
    
    IF agents_count >= 4 AND assignments_count >= 4 THEN
        RAISE NOTICE '✅ Todas las políticas están configuradas correctamente';
        RAISE NOTICE '🎯 Ahora deberías poder crear agentes y asignaciones';
    ELSIF assignments_count >= 4 THEN
        RAISE NOTICE '⚠️  Solo assignments tiene políticas completas';
        RAISE NOTICE '🔧 Necesitas ejecutar el fix para agents también';
    ELSE
        RAISE NOTICE '❌ Faltan políticas en ambas tablas';
        RAISE NOTICE '🔧 Necesitas ejecutar el fix completo';
    END IF;
END $$;
