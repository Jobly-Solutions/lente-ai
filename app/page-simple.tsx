'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Database, Users, MessageSquare, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenido a Lente AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plataforma de inteligencia artificial personalizada para Lente, potenciada por Bravilo
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Agentes</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Datastores</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Chats</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/auth/login">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-lente-100 rounded-lg flex items-center justify-center">
                      <Bot className="w-6 h-6 text-lente-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Iniciar Sesión</h3>
                      <p className="text-sm text-gray-600">Accede a tu cuenta</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/auth/register">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-lente-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-lente-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Registrarse</h3>
                      <p className="text-sm text-gray-600">Crea una nueva cuenta</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>Acerca de Lente AI</span>
            </CardTitle>
            <CardDescription>
              Plataforma de inteligencia artificial personalizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Agentes de IA</h4>
                <p className="text-sm text-gray-600">
                  Crea y configura agentes de inteligencia artificial personalizados para tu negocio.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Gestión de Datos</h4>
                <p className="text-sm text-gray-600">
                  Administra tus fuentes de datos y entrena tus agentes con información relevante.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Chat en Tiempo Real</h4>
                <p className="text-sm text-gray-600">
                  Interactúa con tus agentes de IA a través de una interfaz de chat intuitiva.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
