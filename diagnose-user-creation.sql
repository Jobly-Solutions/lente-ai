-- ========================================
-- DIAGNÓSTICO DE CREACIÓN DE USUARIOS
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Verificar configuración de autenticación
SELECT 'Auth configuration check:' as info;
SELECT 
    'Email confirm required' as setting,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.config 
            WHERE key = 'enable_confirmations' AND value = 'true'
        ) THEN '✅ Sí'
        ELSE '❌ No'
    END as value;

-- Verificar triggers de autenticación
SELECT 'Auth triggers check:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%auth%' OR trigger_name LIKE '%user%'
ORDER BY trigger_name;

-- Verificar función handle_new_user
SELECT 'handle_new_user function check:' as info;
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Verificar función create_admin_user
SELECT 'create_admin_user function check:' as info;
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_admin_user';

-- Verificar usuarios existentes en auth.users
SELECT 'Existing auth.users count:' as info;
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Verificar perfiles existentes
SELECT 'Existing profiles count:' as info;
SELECT COUNT(*) as profiles_count FROM public.profiles;

-- Verificar usuarios recientes (últimos 10)
SELECT 'Recent users (last 10):' as info;
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar perfiles recientes (últimos 10)
SELECT 'Recent profiles (last 10):' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar configuración de RLS en profiles
SELECT 'RLS policies for profiles table:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verificar si RLS está habilitado en profiles
SELECT 'RLS enabled on profiles:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- ========================================
-- CONFIRMACIÓN
-- ========================================

DO $$
DECLARE
    auth_users_count INTEGER;
    profiles_count INTEGER;
    handle_new_user_exists BOOLEAN;
    create_admin_user_exists BOOLEAN;
BEGIN
    -- Contar usuarios
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    
    -- Verificar funciones
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user'
    ) INTO handle_new_user_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'create_admin_user'
    ) INTO create_admin_user_exists;
    
    RAISE NOTICE '🔍 DIAGNÓSTICO DE CREACIÓN DE USUARIOS:';
    RAISE NOTICE '👥 Usuarios en auth.users: %', auth_users_count;
    RAISE NOTICE '👤 Perfiles en public.profiles: %', profiles_count;
    RAISE NOTICE '🔧 Función handle_new_user: %', CASE WHEN handle_new_user_exists THEN '✅ Existe' ELSE '❌ Faltante' END;
    RAISE NOTICE '👑 Función create_admin_user: %', CASE WHEN create_admin_user_exists THEN '✅ Existe' ELSE '❌ Faltante' END;
    
    IF auth_users_count != profiles_count THEN
        RAISE NOTICE '⚠️  ADVERTENCIA: Número de usuarios y perfiles no coincide';
        RAISE NOTICE '   Esto puede indicar problemas con los triggers de autenticación';
    END IF;
    
    IF NOT handle_new_user_exists THEN
        RAISE NOTICE '❌ PROBLEMA: Falta la función handle_new_user';
        RAISE NOTICE '   Ejecuta el script supabase-setup-final.sql completo';
    END IF;
    
    IF NOT create_admin_user_exists THEN
        RAISE NOTICE '❌ PROBLEMA: Falta la función create_admin_user';
        RAISE NOTICE '   Ejecuta el script supabase-setup-final.sql completo';
    END IF;
    
    RAISE NOTICE '✅ DIAGNÓSTICO COMPLETADO';
END $$;
