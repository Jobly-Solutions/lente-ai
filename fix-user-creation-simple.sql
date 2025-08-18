-- ========================================
-- FIX USER CREATION ISSUES - VERSIÓN SIMPLE
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- Paso 1: Crear función handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'company', ''),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 2: Crear función create_admin_user
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

-- Paso 3: Crear trigger on_auth_user_created (si no existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Paso 4: Crear trigger on_auth_user_created_admin (si no existe)
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_admin_user();

-- Paso 5: Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Paso 6: Crear políticas RLS para profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.profiles;
CREATE POLICY "Enable update for authenticated users" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Paso 7: Sincronizar usuarios existentes
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

-- Paso 8: Verificar configuración
SELECT '✅ Configuración completada' as status;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;
