-- Lente AI Database Setup
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Crear tabla profiles
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

-- 2. Crear tabla agents
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

-- 3. Crear tabla assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, agent_id)
);

-- 4. Crear tabla conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla scout_config
CREATE TABLE IF NOT EXISTS public.scout_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    default_agent_id TEXT REFERENCES public.agents(agent_id),
    welcome_message TEXT,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Función para actualizar updated_at
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scout_config_updated_at ON public.scout_config;
CREATE TRIGGER update_scout_config_updated_at BEFORE UPDATE ON public.scout_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Función para crear perfil automáticamente
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
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

-- 9. Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Políticas RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 11. Políticas RLS para agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to agents" ON public.agents;
CREATE POLICY "Admins have full access to agents" ON public.agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para que usuarios vean agentes asignados
DROP POLICY IF EXISTS "Users can view assigned agents" ON public.agents;
CREATE POLICY "Users can view assigned agents" ON public.agents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.agent_id = agents.id AND a.user_id = auth.uid()
        )
        OR
        agents.is_shared = true
    );

-- 12. Políticas RLS para assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.assignments;
CREATE POLICY "Admins have full access to assignments" ON public.assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 13. Políticas RLS para conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- 14. Políticas RLS para scout_config
ALTER TABLE public.scout_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to scout_config" ON public.scout_config;
CREATE POLICY "Admins have full access to scout_config" ON public.scout_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 15. Función RPC para obtener todos los agentes (para admins)
DROP FUNCTION IF EXISTS get_all_agents() CASCADE;
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
    LEFT JOIN public.profiles p ON a.user_id = p.id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 16. Insertar configuración inicial
INSERT INTO public.scout_config (api_key, welcome_message, context)
VALUES (
    '12895462-fdb8-47df-88f6-0976a4e9436e',
    '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
    'Eres un asistente de IA útil y amigable. Responde de manera clara y concisa.'
) ON CONFLICT DO NOTHING;

-- 17. Función para crear usuario administrador automáticamente
DROP FUNCTION IF EXISTS create_admin_user() CASCADE;
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

-- 18. Trigger para asignar rol admin automáticamente
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_admin_user();

-- 17. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON public.agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON public.assignments(agent_id);
