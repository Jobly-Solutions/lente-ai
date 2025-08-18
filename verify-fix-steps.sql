-- ========================================
-- VERIFY FIX STEPS
-- Ejecutar este script después del fix para verificar
-- ========================================

-- Verificación 1: Estructura de tabla profiles
SELECT '1. Profiles table structure:' as verification;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Verificación 2: Restricciones únicas
SELECT '2. Unique constraints:' as verification;
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND constraint_type = 'UNIQUE';

-- Verificación 3: Índices en email
SELECT '3. Email indexes:' as verification;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexdef LIKE '%email%';

-- Verificación 4: Triggers en profiles
SELECT '4. Triggers on profiles:' as verification;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- Verificación 5: Triggers en auth.users
SELECT '5. Triggers on auth.users:' as verification;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Verificación 6: Funciones de autenticación
SELECT '6. Authentication functions:' as verification;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'create_admin_user')
AND routine_schema = 'public';

-- Verificación 7: Políticas RLS
SELECT '7. RLS policies:' as verification;
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verificación 8: RLS habilitado
SELECT '8. RLS enabled:' as verification;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Verificación 9: Conteo de usuarios y perfiles
SELECT '9. User and profile counts:' as verification;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count;

-- Verificación 10: Usuarios sin perfiles
SELECT '10. Users without profiles:' as verification;
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verificación 11: Usuarios admin
SELECT '11. Admin users:' as verification;
SELECT 
    id,
    email,
    full_name,
    role
FROM public.profiles 
WHERE role = 'admin';
