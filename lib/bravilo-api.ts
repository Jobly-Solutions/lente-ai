import axios from 'axios';

const BRAVILO_BASE_URL = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api';

// Function to get API key from environment or localStorage
function getApiKey(): string | null {
  // Hardcoded key for immediate functionality
  const HARDCODED_KEY = "12895462-fdb8-47df-88f6-0976a4e9436e";
  
  // Try different sources
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or hardcoded
    return process.env.BRAVILO_API_KEY || HARDCODED_KEY;
  }
  
  // Client-side: try localStorage, then public env var, then hardcoded
  const localApiKey = localStorage.getItem('BRAVILO_API_KEY');
  if (localApiKey) {
    return localApiKey;
  }
  
  // Try Next.js public environment variable
  if (process.env.NEXT_PUBLIC_BRAVILO_API_KEY) {
    return process.env.NEXT_PUBLIC_BRAVILO_API_KEY;
  }
  
  // Fallback to hardcoded key
  return HARDCODED_KEY;
}

// Fallback agents for when API is not configured
const FALLBACK_AGENTS: Agent[] = [
  {
    id: 'fallback-support',
    name: 'Agente de Soporte',
    description: 'Agente especializado en atención al cliente',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-sales',
    name: 'Agente de Ventas',
    description: 'Agente especializado en ventas y consultas comerciales',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-hr',
    name: 'Agente de RRHH',
    description: 'Agente especializado en recursos humanos',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-finance',
    name: 'Agente Financiero',
    description: 'Agente especializado en finanzas y contabilidad',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-marketing',
    name: 'Agente de Marketing',
    description: 'Agente especializado en marketing digital',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Create axios instance with dynamic headers
function createApiInstance() {
  const apiKey = getApiKey();
  
  return axios.create({
    baseURL: BRAVILO_BASE_URL,
    headers: {
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    timeout: 10000, // 10 second timeout
  });
}

// Types
export interface Agent {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive'; // Optional because Bravilo API doesn't always include it
  createdAt: string;
  updatedAt: string;
  // Additional fields from Bravilo API
  hidden?: boolean;
  visibility?: 'public' | 'private';
  organizationId?: string;
  // Prompt configuration
  systemPrompt?: string;
  userPrompt?: string;
  modelName?: 'gpt_3_5_turbo' | 'gpt_3_5_turbo_16k' | 'gpt_4' | 'gpt_4_32k' | 'gpt_4o';
  temperature?: number;
  // Tools configuration
  tools?: Array<{
    type: string;
    datastoreId?: string;
    [key: string]: any;
  }>;
}

export interface Datastore {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'pdf' | 'csv' | 'json';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// New: Bravilo Datasource entity (minimal shape we need for GET/DELETE)
export interface Datasource {
  id: string;
  type: string;
  name: string;
  status: 'unsynched' | 'pending' | 'running' | 'synched' | 'error' | 'usage_limit_reached';
  groupId?: string;
  updatedAt: string;
  createdAt: string;
  lastSynch?: string;
  config?: Record<string, any>;
}

// New: Datastore query result
export interface DatastoreQueryResult {
  text: string;
  score: number;
  source?: string;
  datasource_id?: string;
  datasource_name?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatSession {
  id: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// API Functions
export const braviloApiClient = {
  // Agents
  async getAgents(): Promise<Agent[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn('⚠️ BRAVILO_API_KEY no configurada, usando agentes de prueba');
      return FALLBACK_AGENTS;
    }

    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.get('/agents');
      
      // Transform Bravilo API response to our Agent interface
      const agents = response.data.map((agent: any): Agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.hidden ? 'inactive' : 'active', // Convert Bravilo's hidden field
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        hidden: agent.hidden,
        visibility: agent.visibility,
        organizationId: agent.organizationId
      }));
      
      console.log(`✅ ${agents.length} agentes obtenidos de Bravilo API`);
      return agents;
    } catch (error) {
      console.error('❌ Error obteniendo agentes de API:', error);
      console.warn('⚠️ Usando agentes de prueba como fallback');
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      return FALLBACK_AGENTS;
    }
  },

  async getAgent(id: string): Promise<Agent> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      const fallbackAgent = FALLBACK_AGENTS.find(a => a.id === id);
      if (fallbackAgent) {
        return fallbackAgent;
      }
      throw new Error('Agente no encontrado');
    }

    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.get(`/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo agente de API:', error);
      const fallbackAgent = FALLBACK_AGENTS.find(a => a.id === id);
      if (fallbackAgent) {
        return fallbackAgent;
      }
      throw error;
    }
  },

  async createAgent(data: { 
    name: string; 
    description?: string; 
    systemPrompt?: string; 
    userPrompt?: string; 
    modelName?: 'gpt_3_5_turbo' | 'gpt_3_5_turbo_16k' | 'gpt_4' | 'gpt_4_32k' | 'gpt_4o'; 
    temperature?: number; 
    visibility?: 'public' | 'private' 
  }): Promise<Agent> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para crear agentes');
    }

    const braviloApi = createApiInstance();
    const response = await braviloApi.post('/agents', data);
    return response.data;
  },

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para actualizar agentes');
    }

    const braviloApi = createApiInstance();
    const response = await braviloApi.patch(`/agents/${id}`, data);
    return response.data;
  },

  async deleteAgent(id: string): Promise<void> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para eliminar agentes');
    }

    const braviloApi = createApiInstance();
    await braviloApi.delete(`/agents/${id}`);
  },

  // Datastores
  async getDatastores(): Promise<Datastore[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return [];
    }

    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.get('/datastores');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo datastores:', error);
      return [];
    }
  },

  async getDatastore(id: string): Promise<Datastore> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada');
    }

    const braviloApi = createApiInstance();
    const response = await braviloApi.get(`/datastores/${id}`);
    return response.data;
  },

  // New: Query Datastore chunks
  async queryDatastore(id: string, data: { query: string; topK?: number; filters?: { custom_ids?: string[]; datasource_ids?: string[] } }): Promise<DatastoreQueryResult[]> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return [];
    }
    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.post(`/datastores/${id}/query`, data);
      return response.data as DatastoreQueryResult[];
    } catch (error) {
      console.error('❌ Error querying datastore:', error);
      return [];
    }
  },

  async createDatastore(data: { name: string; description?: string; type: string }): Promise<Datastore> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para crear datastores');
    }

    // Usar proxy server-side para evitar CORS y unificar auth
    const response = await axios.post('/api/datastores', data, {
      headers: { 'Cache-Control': 'no-store' },
    });
    return response.data as Datastore;
  },

  async updateDatastore(id: string, data: Partial<Datastore>): Promise<Datastore> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para actualizar datastores');
    }

    const braviloApi = createApiInstance();
    const response = await braviloApi.put(`/datastores/${id}`, data);
    return response.data;
  },

  async deleteDatastore(id: string): Promise<void> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para eliminar datastores');
    }

    const braviloApi = createApiInstance();
    await braviloApi.delete(`/datastores/${id}`);
  },

  // New: Datasource - Create (file)
  async createDatasourceFile(params: { datastoreId: string; file: File | Blob; fileName?: string; customId?: string }): Promise<Datasource> {
    const { datastoreId, file, fileName, customId } = params;
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('API key no configurada para crear datasources (file)');
    }
    const formData = new FormData();
    const resolvedName = fileName || (file as any).name || 'upload';
    formData.append('file', file, resolvedName);
    formData.append('fileName', resolvedName);
    formData.append('type', 'file');
    formData.append('datastoreId', datastoreId);
    if (customId) formData.append('custom_id', customId);
    const response = await axios.post('/api/datasources', formData, {
      headers: {
        // Let the browser set the multipart boundary automatically
        'Cache-Control': 'no-store',
      },
    });
    return response.data as Datasource;
  },

  // New: Datasource - Create (web_page)
  async createDatasourceWebPage(params: { datastoreId: string; name: string; sourceUrl: string; customId?: string }): Promise<Datasource> {
    const { datastoreId, name, sourceUrl, customId } = params;
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('API key no configurada para crear datasources (web_page)');
    }
    const payload = {
      datastoreId,
      type: 'página_web',
      name,
      config: { source_url: sourceUrl },
      ...(customId ? { custom_id: customId } : {}),
    };
    const response = await axios.post('/api/datasources', payload, {
      headers: { 'Cache-Control': 'no-store' },
    });
    return response.data as Datasource;
  },

  // New: Datasource - Create (web_site)
  async createDatasourceWebSite(params: { datastoreId: string; name: string; sitemap?: string; sourceUrl?: string; customId?: string }): Promise<Datasource> {
    const { datastoreId, name, sitemap, sourceUrl, customId } = params;
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('API key no configurada para crear datasources (web_site)');
    }
    const payload: any = {
      datastoreId,
      type: 'sitio_web',
      name,
      config: {},
    };
    if (sitemap) payload.config.sitemap = sitemap;
    if (sourceUrl) payload.config.source_url = sourceUrl;
    if (customId) payload.custom_id = customId;
    const response = await axios.post('/api/datasources', payload, {
      headers: { 'Cache-Control': 'no-store' },
    });
    return response.data as Datasource;
  },

  // New: Datasource - Get
  async getDatasource(id: string): Promise<Datasource | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.get(`/datasources/${id}`);
      return response.data as Datasource;
    } catch (error) {
      console.error('❌ Error getting datasource:', error);
      return null;
    }
  },

  // New: Datasource - List by datastore
  // Note: Bravilo API doesn't have a direct endpoint to list datasources by datastore
  // We'll use the datastore query endpoint to get information about sources
  async getDatasourcesByDatastore(datastoreId: string): Promise<Datasource[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    try {
      // Try to get all datasources first (if this endpoint exists)
      const braviloApi = createApiInstance();
      const response = await braviloApi.get(`/datasources`);
      
      // Filter by datastoreId if the response is an array
      if (Array.isArray(response.data)) {
        return response.data.filter((ds: any) => ds.datastoreId === datastoreId || ds.groupId === datastoreId);
      }
      
      // If not an array, return empty array
      return [];
    } catch (error) {
      console.error('❌ Error getting datasources by datastore:', error);
      // Return empty array as fallback
      return [];
    }
  },

  // New: Datasource - Delete
  async deleteDatasource(id: string): Promise<boolean> {
    const apiKey = getApiKey();
    if (!apiKey) return false;
    try {
      const braviloApi = createApiInstance();
      await braviloApi.delete(`/datasources/${id}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting datasource:', error);
      return false;
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return [];
    }

    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.get('/users');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return [];
    }
  },

  async getUser(id: string): Promise<User> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada');
    }

    const braviloApi = createApiInstance();
    const response = await braviloApi.get(`/users/${id}`);
    return response.data;
  },

  async createUser(data: { email: string; name: string; role?: string }): Promise<User> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para crear usuarios');
    }

    const braviloApi = createApiInstance();
    const response = await braviloApi.post('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para actualizar usuarios');
    }

    const braviloApi = createApiInstance();
    const response = await braviloApi.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key no configurada para eliminar usuarios');
    }

    const braviloApi = createApiInstance();
    await braviloApi.delete(`/users/${id}`);
  },

  // Chat
  async createChatSession(agentId: string): Promise<ChatSession> {
    // Use query endpoint as single-message session (no need for separate session id)
    // The caller can keep the returned conversationId for subsequent messages
    const response = await axios.post(`/api/agents/${agentId}/query`, {
      query: 'Hola',
      streaming: false,
    }, { headers: { 'Cache-Control': 'no-store' } });
    return {
      id: (response.data?.conversationId as string) || `${Date.now()}`,
      agentId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ChatSession
  },

  async sendMessage(sessionId: string, message: string, conversationId?: string): Promise<{ answer: string; conversationId?: string }> {
    // We use the agent query endpoint again, keeping conversationId
    const response = await axios.post(`/api/agents/${sessionId}/query`, {
      query: message,
      conversationId,
      streaming: false,
    }, { headers: { 'Cache-Control': 'no-store' } });
    return { answer: response.data?.answer || '', conversationId: response.data?.conversationId }
  },

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return [];
    }

    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.get(`/chat/sessions/${sessionId}/messages`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo historial de chat:', error);
      return [];
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return {
        status: 'fallback_mode',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const braviloApi = createApiInstance();
      const response = await braviloApi.get('/health');
      return response.data;
    } catch (error) {
      console.error('❌ Error en health check:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  },

  // Utility function to check if API is configured
  isApiConfigured(): boolean {
    return !!getApiKey();
  },

  // Function to clear API key from localStorage
  clearApiKey(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('BRAVILO_API_KEY');
    }
  },
};

export default braviloApiClient;
