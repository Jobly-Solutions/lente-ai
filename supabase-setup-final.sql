-- Lente AI Database Setup - Final Version
-- Ejecutar este script en el SQL Editor de Supabase
-- Versión final que respeta el diagrama de base de datos

-- ========================================
-- 1. LIMPIAR OBJETOS EXISTENTES
-- ========================================

-- Eliminar triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_scout_config_updated_at ON public.scout_config;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_all_agents() CASCADE;
DROP FUNCTION IF EXISTS create_admin_user() CASCADE;

-- ========================================
-- 2. ELIMINAR TABLAS EXISTENTES (SI EXISTEN)
-- ========================================

-- Eliminar tablas en orden correcto (por dependencias)
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.scout_config CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ========================================
-- 3. CREAR TABLAS (RESPETANDO EL DIAGRAMA)
-- ========================================

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT,
    branding JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de agentes
CREATE TABLE public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    welcome_message TEXT,
    context TEXT,
    is_active BOOLEAN DEFAULT true,
    is_shared BOOLEAN DEFAULT false,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asignaciones
CREATE TABLE public.assignments (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, agent_id)
);

-- Tabla de conversaciones
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración global (respetando el diagrama)
CREATE TABLE public.scout_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    default_agent_id TEXT,
    welcome_message TEXT,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. FUNCIONES BÁSICAS
-- ========================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear perfil automáticamente
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

-- Función para asignar rol admin
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

-- Función para obtener agentes (admin)
CREATE OR REPLACE FUNCTION get_all_agents()
RETURNS TABLE (
    id UUID,
    agent_id TEXT,
    name TEXT,
    description TEXT,
    is_active BOOLEAN,
    is_shared BOOLEAN,
    user_id UUID,
    user_name TEXT,
    created_at TIMESTAMPTZ
) SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.agent_id,
        a.name,
        a.description,
        a.is_active,
        a.is_shared,
        a.user_id,
        COALESCE(p.full_name, '') as user_name,
        a.created_at
    FROM public.agents a
    LEFT JOIN public.profiles p ON a.user_id = p.id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. TRIGGERS
-- ========================================

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scout_config_updated_at 
    BEFORE UPDATE ON public.scout_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear perfil
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para asignar admin
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_admin_user();

-- ========================================
-- 6. ROW LEVEL SECURITY (MÍNIMO)
-- ========================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_config ENABLE ROW LEVEL SECURITY;

-- Políticas mínimas para profiles
CREATE POLICY "Enable read access for all users" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on id" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas mínimas para agents
CREATE POLICY "Enable read access for all users" ON public.agents
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.agents
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas mínimas para assignments
CREATE POLICY "Enable read access for all users" ON public.assignments
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.assignments
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas mínimas para conversations
CREATE POLICY "Enable read access for all users" ON public.conversations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas mínimas para scout_config
CREATE POLICY "Enable read access for all users" ON public.scout_config
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.scout_config
    FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- 7. DATOS INICIALES
-- ========================================

-- Configuración inicial
INSERT INTO public.scout_config (api_key, default_agent_id, welcome_message, context)
VALUES (
    '12895462-fdb8-47df-88f6-0976a4e9436e',
    'default',
    '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
    'Eres un asistente de IA útil y amigable. Responde de manera clara y concisa.'
);

-- ========================================
-- 8. ÍNDICES
-- ========================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_agents_agent_id ON public.agents(agent_id);
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_agent_id ON public.assignments(agent_id);

-- ========================================
-- 9. CONFIRMACIÓN
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Lente AI Database configurada exitosamente!';
    RAISE NOTICE '👨‍💼 Admin: jc.falcon@lenteconsulting.com';
    RAISE NOTICE '🔐 Registra este usuario para acceso completo';
    RAISE NOTICE '📊 Tablas creadas: profiles, agents, assignments, conversations, scout_config';
END $$;
