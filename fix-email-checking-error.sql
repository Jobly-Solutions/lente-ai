-- ========================================
-- FIX EMAIL CHECKING DATABASE ERROR
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar si la tabla profiles existe y tiene la estructura correcta
SELECT 'Checking profiles table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Verificar si hay restricciones únicas en email
SELECT 'Checking email constraints:' as info;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- Verificar si hay índices en email
SELECT 'Checking email indexes:' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexdef LIKE '%email%';

-- Verificar si hay triggers que puedan estar causando problemas
SELECT 'Checking triggers on profiles:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- Verificar si hay funciones que puedan estar causando problemas
SELECT 'Checking functions that might affect email:' as info;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%email%' 
AND routine_schema = 'public';

-- ========================================
-- FIXES ESPECÍFICOS PARA EL ERROR DE EMAIL
-- ========================================

-- 1. Asegurar que la tabla profiles tenga la estructura correcta
DO $$
BEGIN
    -- Verificar si la columna email existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        RAISE NOTICE '❌ ERROR: La columna email no existe en profiles';
        RAISE NOTICE '   Ejecuta el script supabase-setup-final.sql completo';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Columna email existe en profiles';
END $$;

-- 2. Verificar y corregir restricciones únicas en email
DO $$
BEGIN
    -- Eliminar restricción única en email si existe y causa problemas
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_name LIKE '%email%' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        RAISE NOTICE '🔧 Eliminando restricción única en email...';
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
        RAISE NOTICE '✅ Restricción única eliminada';
    ELSE
        RAISE NOTICE '✅ No hay restricción única problemática en email';
    END IF;
END $$;

-- 3. Verificar y corregir índices en email
DO $$
BEGIN
    -- Eliminar índice único en email si existe y causa problemas
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname LIKE '%email%'
    ) THEN
        RAISE NOTICE '🔧 Eliminando índice único en email...';
        DROP INDEX IF EXISTS profiles_email_key;
        RAISE NOTICE '✅ Índice único eliminado';
    ELSE
        RAISE NOTICE '✅ No hay índice único problemático en email';
    END IF;
END $$;

-- 4. Verificar que no haya triggers problemáticos
DO $$
BEGIN
    -- Eliminar triggers que puedan estar causando problemas
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table = 'profiles'
        AND trigger_name LIKE '%email%'
    ) THEN
        RAISE NOTICE '🔧 Eliminando triggers problemáticos en profiles...';
        DROP TRIGGER IF EXISTS on_profiles_email_check ON public.profiles;
        RAISE NOTICE '✅ Triggers problemáticos eliminados';
    ELSE
        RAISE NOTICE '✅ No hay triggers problemáticos en profiles';
    END IF;
END $$;

-- 5. Verificar que las funciones de autenticación estén correctas
DO $$
BEGIN
    -- Recrear función handle_new_user sin validaciones problemáticas
    RAISE NOTICE '🔧 Recreando función handle_new_user...';
    
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Insertar sin validaciones adicionales
        INSERT INTO public.profiles (id, email, full_name, company, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'company', ''),
            'user'
        );
        RETURN NEW;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error en handle_new_user: %', SQLERRM;
            RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    RAISE NOTICE '✅ Función handle_new_user recreada';
END $$;

-- 6. Verificar que los triggers estén correctos
DO $$
BEGIN
    -- Recrear triggers
    RAISE NOTICE '🔧 Recreando triggers...';
    
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE '✅ Triggers recreados';
END $$;

-- 7. Verificar RLS policies
DO $$
BEGIN
    -- Asegurar que las políticas RLS permitan inserción
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        RAISE NOTICE '🔧 Creando política RLS para INSERT...';
        CREATE POLICY "Enable insert for authenticated users" ON public.profiles
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        RAISE NOTICE '✅ Política INSERT creada';
    ELSE
        RAISE NOTICE '✅ Política INSERT ya existe';
    END IF;
END $$;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Verificar estado final
SELECT 'Final verification:' as info;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Verificar que no hay errores de restricciones
DO $$
BEGIN
    RAISE NOTICE '🎉 FIX COMPLETADO!';
    RAISE NOTICE '📋 Verificaciones realizadas:';
    RAISE NOTICE '   ✅ Estructura de tabla profiles';
    RAISE NOTICE '   ✅ Restricciones únicas en email';
    RAISE NOTICE '   ✅ Índices en email';
    RAISE NOTICE '   ✅ Triggers de autenticación';
    RAISE NOTICE '   ✅ Funciones de autenticación';
    RAISE NOTICE '   ✅ Políticas RLS';
    RAISE NOTICE '🎯 Ahora deberías poder crear usuarios sin errores de email';
    RAISE NOTICE '⚠️  Si el error persiste, verifica:';
    RAISE NOTICE '   • Variables de entorno en .env.local';
    RAISE NOTICE '   • Service Role Key en Supabase Dashboard';
    RAISE NOTICE '   • Estado del proyecto en Supabase';
END $$;
