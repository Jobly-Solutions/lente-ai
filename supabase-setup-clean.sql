-- Lente AI Database Setup - Clean Version
-- Ejecutar este script en el SQL Editor de Supabase
-- Este script elimina objetos existentes antes de crearlos

-- ========================================
-- 1. ELIMINAR OBJETOS EXISTENTES
-- ========================================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_scout_config_updated_at ON public.scout_config;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_all_agents() CASCADE;
DROP FUNCTION IF EXISTS create_admin_user() CASCADE;

-- Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to agents" ON public.agents;
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.agents;
DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins have full access to scout_config" ON public.scout_config;

-- ========================================
-- 2. CREAR TABLAS
-- ========================================

-- Crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Crear tabla agents
CREATE TABLE IF NOT EXISTS public.agents (
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

-- Crear tabla assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, agent_id)
);

-- Crear tabla conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla scout_config
CREATE TABLE IF NOT EXISTS public.scout_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    default_agent_id TEXT REFERENCES public.agents(agent_id),
    welcome_message TEXT,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. CREAR FUNCIONES
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'company',
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función RPC para obtener todos los agentes (para admins)
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
        p.full_name as user_name,
        a.created_at
    FROM public.agents a
    LEFT JOIN public.profiles p ON a.user_id = p.id::UUID
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para crear usuario administrador automáticamente
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el email es jc.falcon@lenteconsulting.com, asignar rol admin
    IF NEW.email = 'jc.falcon@lenteconsulting.com' THEN
        UPDATE public.profiles 
        SET role = 'admin'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. CREAR TRIGGERS
-- ========================================

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scout_config_updated_at BEFORE UPDATE ON public.scout_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para asignar rol admin automáticamente
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_admin_user();

-- ========================================
-- 5. CONFIGURAR ROW LEVEL SECURITY
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_config ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid()::UUID = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::UUID AND role = 'admin'
        )
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::UUID = id);

-- Políticas para agents
CREATE POLICY "Admins have full access to agents" ON public.agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::UUID AND role = 'admin'
        )
    );

CREATE POLICY "Users can view assigned agents" ON public.agents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.agent_id = agents.id AND a.user_id = auth.uid()::UUID
        )
        OR
        agents.is_shared = true
    );

-- Políticas para assignments
CREATE POLICY "Admins have full access to assignments" ON public.assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::UUID AND role = 'admin'
        )
    );

-- Políticas para conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid()::UUID = user_id);

CREATE POLICY "Admins can view all conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::UUID AND role = 'admin'
        )
    );

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid()::UUID = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid()::UUID = user_id);

-- Políticas para scout_config
CREATE POLICY "Admins have full access to scout_config" ON public.scout_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::UUID AND role = 'admin'
        )
    );

-- ========================================
-- 6. INSERTAR DATOS INICIALES
-- ========================================

-- Insertar configuración inicial
INSERT INTO public.scout_config (api_key, welcome_message, context)
VALUES (
    '12895462-fdb8-47df-88f6-0976a4e9436e',
    '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
    'Eres un asistente de IA útil y amigable. Responde de manera clara y concisa.'
) ON CONFLICT DO NOTHING;

-- ========================================
-- 7. CREAR ÍNDICES
-- ========================================

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON public.agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON public.assignments(agent_id);

-- ========================================
-- 8. MENSAJE DE CONFIRMACIÓN
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos Lente AI configurada exitosamente!';
    RAISE NOTICE '👨‍💼 Usuario admin: jc.falcon@lenteconsulting.com';
    RAISE NOTICE '🔐 Registra este usuario para obtener acceso completo';
END $$;
