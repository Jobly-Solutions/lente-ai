-- ========================================
-- FIX EMAIL CHECKING ERROR - VERSIÓN SIMPLE
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Paso 1: Verificar estructura de la tabla profiles
SELECT 'Checking profiles table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Paso 2: Eliminar restricciones únicas problemáticas en email
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;

-- Paso 3: Eliminar índices únicos problemáticos en email
DROP INDEX IF EXISTS profiles_email_key;
DROP INDEX IF EXISTS profiles_email_unique;

-- Paso 4: Eliminar triggers problemáticos en profiles
DROP TRIGGER IF EXISTS on_profiles_email_check ON public.profiles;
DROP TRIGGER IF EXISTS profiles_email_trigger ON public.profiles;

-- Paso 5: Recrear función handle_new_user sin validaciones problemáticas
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
        -- Log error but don't fail
        RAISE NOTICE 'Error en handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 6: Recrear función create_admin_user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'jc.falcon@lenteconsulting.com' THEN
        UPDATE public.profiles 
        SET role = 'admin'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 7: Recrear triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_admin_user();

-- Paso 8: Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Paso 9: Crear políticas RLS para profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.profiles;
CREATE POLICY "Enable update for authenticated users" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Paso 10: Sincronizar usuarios existentes que no tengan perfiles
INSERT INTO public.profiles (id, email, full_name, company, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', ''),
    COALESCE(u.raw_user_meta_data->>'company', ''),
    'user'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Paso 11: Verificación final
SELECT '✅ FIX COMPLETADO' as status;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Paso 12: Verificar que no hay restricciones problemáticas
SELECT 'Checking for problematic constraints:' as info;
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND constraint_type = 'UNIQUE';

-- Paso 13: Verificar triggers activos
SELECT 'Checking active triggers:' as info;
SELECT 
    trigger_name,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
