'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Bot, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { braviloApiClient, Agent, ChatMessage } from '@/lib/bravilo-api'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { formatRelativeTime } from '@/lib/utils'

function ChatContent() {
  const searchParams = useSearchParams()
  const agentId = searchParams.get('agent')
  
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()

  useEffect(() => {
    console.log('Chat component - User state:', { user, hasUser: !!user, userId: user?.id })
  }, [user])

  useEffect(() => {
    if (user?.id) {
      loadAgents(user.id)
    } else {
      setAgents([])
      setSelectedAgent(null)
    }
  }, [user?.id])

  useEffect(() => {
    if (agentId && agents.length > 0) {
      const agent = agents.find(a => a.id === agentId)
      if (agent) {
        setSelectedAgent(agent)
        startNewSession(agent.id)
      }
    }
  }, [agentId, agents])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadAgents(currentUserId: string) {
    try {
      // 1) Obtener asignaciones (IDs locales de agentes)
      const { data: userAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('agent_id', { head: false })
        .eq('user_id', currentUserId)

      if (assignmentsError) {
        console.error('Error fetching user assignments:', assignmentsError)
        setAgents([])
        return
      }

      const localAgentIds: string[] = (userAssignments || []).map((r: any) => r.agent_id).filter(Boolean)

      if (localAgentIds.length === 0) {
        setAgents([])
        return
      }

      // 2) Mapear a agent_id de Bravilo
      const { data: localAgents, error: localAgentsError } = await supabase
        .from('agents')
        .select('id, agent_id, name, description', { head: false })
        .in('id', localAgentIds)

      if (localAgentsError) {
        console.error('Error fetching local agents:', localAgentsError)
        setAgents([])
        return
      }

      const localByBraviloId: Record<string, any> = Object.fromEntries(
        (localAgents || [])
          .filter((a: any) => Boolean(a.agent_id))
          .map((a: any) => [a.agent_id as string, a])
      )

      const allowedBraviloIds = Object.keys(localByBraviloId)

      if (allowedBraviloIds.length === 0) {
        setAgents([])
        return
      }

      // 3) Obtener agentes desde Bravilo y filtrar por los asignados
      let finalAgents: Agent[] = []
      try {
        const agentsData = await braviloApiClient.getAgents()
        const apiById: Record<string, Agent> = Object.fromEntries(
          (agentsData || []).map((a: Agent) => [a.id, a])
        )
        finalAgents = allowedBraviloIds
          .map((id) => apiById[id])
          .filter(Boolean) as Agent[]
      } catch (e) {
        console.warn('Falling back to local agents only', e)
      }

      // If API didn't return them, fallback to local rows to ensure visibility
      if (finalAgents.length === 0) {
        finalAgents = allowedBraviloIds.map((id) => {
          const local = localByBraviloId[id]
          return {
            id,
            name: local?.name || 'Agente',
            description: local?.description || undefined,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Agent
        })
      }

      setAgents(finalAgents)
      // Auto-select single agent and load history
      if (finalAgents.length === 1) {
        setSelectedAgent(finalAgents[0])
        const found = await loadHistory(finalAgents[0].id)
        if (!found) {
          await startNewSession(finalAgents[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error)
      setAgents([])
    }
  }

  async function startNewSession(agentId: string) {
    try {
      setSessionId(agentId) // use agentId as temporary conversation key
      setMessages([])
      
      // Try to load existing conversation history
      const hasHistory = await loadHistory(agentId)
      if (!hasHistory) {
        // If no history, start with a welcome message
        const welcomeMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `Hola! Soy ${selectedAgent?.name || 'tu asistente'}. ¿En qué puedo ayudarte?`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error('Error creating chat session:', error)
    }
  }

  async function loadHistory(agentId: string): Promise<boolean> {
    try {
      const u = await supabase.auth.getUser()
      const userId = u.data.user?.id
      
      // Try to load history for authenticated user first
      if (userId) {
        console.log('Loading history for authenticated user:', { userId, agentId })
        
        const { data, error } = await supabase
          .from('conversations')
          .select('conversation_id, messages')
          .eq('user_id', userId)
          .eq('agent_id', agentId)
          .order('updated_at', { ascending: false })
          .limit(1)
          
        if (error) {
          console.error('Error loading history:', error)
        } else if (data && data[0]) {
          const row = data[0]
          const msgs = Array.isArray(row.messages) ? row.messages : []
          console.log('Loaded messages for authenticated user:', msgs.length)
          
          setSessionId(row.conversation_id || agentId)
          setMessages(msgs)
          return msgs.length > 0
        }
      }
      
      // Fallback: try to load any conversation for this agent (for anonymous users)
      console.log('Trying to load any conversation for agent:', agentId)
      
      const { data, error } = await supabase
        .from('conversations')
        .select('conversation_id, messages')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        
      if (error) {
        console.error('Error loading fallback history:', error)
        return false
      }
      
      console.log('Fallback history data:', data)
      
      const row = data && data[0]
      if (!row) {
        console.log('No conversation found for agent')
        return false
      }
      
      const msgs = Array.isArray(row.messages) ? row.messages : []
      console.log('Loaded fallback messages:', msgs.length)
      
      setSessionId(row.conversation_id || agentId)
      setMessages(msgs)
      return msgs.length > 0
    } catch (error) {
      console.error('Error in loadHistory:', error)
      return false
    }
  }

  async function sendMessage() {
    if (!inputMessage.trim() || !selectedAgent || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    // Always save user message first
    const u = await supabase.auth.getUser()
    const userId = u.data.user?.id
    const convId = sessionId || selectedAgent.id
    setSessionId(convId)
    
    console.log('User authentication check:', { 
      user: u.data.user, 
      userId, 
      hasUser: !!u.data.user,
      error: u.error 
    })

    // Save user message (with or without authentication)
    const saveUserId = userId || 'anonymous-' + Date.now()
    try {
      console.log('Saving user message:', { userId: saveUserId, agentId: selectedAgent.id, conversationId: convId, role: 'user', content: userMessage.content })
      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: saveUserId, agentId: selectedAgent.id, conversationId: convId, role: 'user', content: userMessage.content }),
      })
      const result = await response.json()
      console.log('User message save result:', result)
    } catch (error) {
      console.error('Error saving user message:', error)
    }

    try {
      const result = await braviloApiClient.sendMessage(selectedAgent.id, inputMessage, sessionId || undefined)
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        content: result.answer,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message
      try {
        console.log('Saving assistant message:', { userId: saveUserId, agentId: selectedAgent.id, conversationId: convId, role: 'assistant', content: assistantMessage.content })
        const response = await fetch('/api/chat/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: saveUserId, agentId: selectedAgent.id, conversationId: convId, role: 'assistant', content: assistantMessage.content }),
        })
        const result = await response.json()
        console.log('Assistant message save result:', result)
      } catch (error) {
        console.error('Error saving assistant message:', error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])

      // Save error message
      try {
        await fetch('/api/chat/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: saveUserId, agentId: selectedAgent.id, conversationId: convId, role: 'assistant', content: errorMessage.content }),
        })
      } catch (error) {
        console.error('Error saving error message:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div className="grid grid-cols-1 gap-6">
          {/* Chat Interface - Full Width */}
          <Card className="h-[75vh] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-lente-600" />
                  <CardTitle>{selectedAgent ? selectedAgent.name : 'Chat'}</CardTitle>
                  {selectedAgent && <span className="text-sm text-gray-500">• Activo</span>}
                </div>
                {/* Simple selector cuando hay múltiples agentes asignados */}
                {agents.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-500">Agente</label>
                    <select
                      value={selectedAgent?.id || ''}
                      onChange={async (e) => {
                        const ag = agents.find((a) => a.id === e.target.value)
                        if (ag) {
                          setSelectedAgent(ag)
                          const found = await loadHistory(ag.id)
                          if (!found) {
                            await startNewSession(ag.id)
                          }
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="" disabled>Seleccionar…</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {selectedAgent?.description && (
                <CardDescription>{selectedAgent.description}</CardDescription>
              )}
            </CardHeader>
              
            <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && selectedAgent ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <p>Inicia una conversación con {selectedAgent.name}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <p>{agents.length > 0 ? 'Selecciona un agente para comenzar a chatear' : 'No hay agentes disponibles'}</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-lente-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            {message.role === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                            <span className="text-xs opacity-70">
                              {formatRelativeTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu mensaje..."
                      disabled={!selectedAgent || loading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!selectedAgent || !inputMessage.trim() || loading}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando chat...</p>
          </div>
        </main>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
