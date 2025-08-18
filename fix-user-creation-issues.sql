-- ========================================
-- FIX USER CREATION ISSUES
-- Ejecutar este script en el SQL Editor de Supabase
-- ========================================

-- 1. Crear función handle_new_user (si no existe)
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

-- 2. Crear función create_admin_user (si no existe)
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

-- 3. Verificar y crear triggers si no existen
DO $$
BEGIN
    -- Trigger para handle_new_user
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE '🔧 Creando trigger on_auth_user_created...';
        
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            
        RAISE NOTICE '✅ Trigger on_auth_user_created creado';
    ELSE
        RAISE NOTICE '✅ Trigger on_auth_user_created ya existe';
    END IF;
    
    -- Trigger para create_admin_user
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created_admin'
    ) THEN
        RAISE NOTICE '🔧 Creando trigger on_auth_user_created_admin...';
        
        CREATE TRIGGER on_auth_user_created_admin
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION create_admin_user();
            
        RAISE NOTICE '✅ Trigger on_auth_user_created_admin creado';
    ELSE
        RAISE NOTICE '✅ Trigger on_auth_user_created_admin ya existe';
    END IF;
END $$;

-- 4. Verificar y crear políticas RLS para profiles si no existen
DO $$
BEGIN
    -- Política para SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Enable read access for authenticated users'
    ) THEN
        RAISE NOTICE '🔧 Creando política RLS para SELECT en profiles...';
        
        CREATE POLICY "Enable read access for authenticated users" ON public.profiles
            FOR SELECT USING (auth.role() = 'authenticated');
            
        RAISE NOTICE '✅ Política SELECT creada';
    ELSE
        RAISE NOTICE '✅ Política SELECT ya existe';
    END IF;
    
    -- Política para INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Enable insert for authenticated users'
    ) THEN
        RAISE NOTICE '🔧 Creando política RLS para INSERT en profiles...';
        
        CREATE POLICY "Enable insert for authenticated users" ON public.profiles
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            
        RAISE NOTICE '✅ Política INSERT creada';
    ELSE
        RAISE NOTICE '✅ Política INSERT ya existe';
    END IF;
    
    -- Política para UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Enable update for authenticated users'
    ) THEN
        RAISE NOTICE '🔧 Creando política RLS para UPDATE en profiles...';
        
        CREATE POLICY "Enable update for authenticated users" ON public.profiles
            FOR UPDATE USING (auth.role() = 'authenticated');
            
        RAISE NOTICE '✅ Política UPDATE creada';
    ELSE
        RAISE NOTICE '✅ Política UPDATE ya existe';
    END IF;
END $$;

-- 5. Verificar que RLS esté habilitado en profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'profiles' AND rowsecurity = true
    ) THEN
        RAISE NOTICE '🔧 Habilitando RLS en tabla profiles...';
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ RLS habilitado en profiles';
    ELSE
        RAISE NOTICE '✅ RLS ya está habilitado en profiles';
    END IF;
END $$;

-- 6. Sincronizar usuarios existentes que no tengan perfiles
DO $$
DECLARE
    missing_profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_profile_count
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL;
    
    IF missing_profile_count > 0 THEN
        RAISE NOTICE '🔧 Creando % perfiles faltantes...', missing_profile_count;
        
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
        
        RAISE NOTICE '✅ Perfiles creados';
    ELSE
        RAISE NOTICE '✅ Todos los usuarios tienen perfiles';
    END IF;
END $$;

-- ========================================
-- CONFIRMACIÓN FINAL
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🎉 FIX COMPLETADO EXITOSAMENTE!';
    RAISE NOTICE '📋 Verificaciones realizadas:';
    RAISE NOTICE '   ✅ Función handle_new_user';
    RAISE NOTICE '   ✅ Función create_admin_user';
    RAISE NOTICE '   ✅ Triggers de autenticación';
    RAISE NOTICE '   ✅ Políticas RLS para profiles';
    RAISE NOTICE '   ✅ Sincronización de usuarios existentes';
    RAISE NOTICE '🎯 Ahora deberías poder:';
    RAISE NOTICE '   • Crear usuarios sin errores';
    RAISE NOTICE '   • Los perfiles se crearán automáticamente';
    RAISE NOTICE '   • El usuario jc.falcon@lenteconsulting.com será admin';
    RAISE NOTICE '⚠️  IMPORTANTE: Verifica las variables de entorno:';
    RAISE NOTICE '   • NEXT_PUBLIC_SUPABASE_URL';
    RAISE NOTICE '   • SUPABASE_SERVICE_ROLE_KEY';
    RAISE NOTICE '   • NEXT_PUBLIC_SUPABASE_ANON_KEY';
END $$;
