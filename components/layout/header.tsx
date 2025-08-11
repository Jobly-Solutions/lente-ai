'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Users, Database, Bot, LogOut, User, ChevronDown, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { LenteLogo } from '@/components/ui/lente-logo'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <LenteLogo size="md" showText={true} />
            </Link>
          </div>
          
          {user && (
            <nav className="hidden md:flex space-x-8">
              <Link href="/chat" className="flex items-center space-x-1 text-gray-600 hover:text-lente-600 transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </Link>
              {(profile?.role === 'admin' || user.email?.toLowerCase() === 'jc.falcon@lenteconsulting.com') && (
                <>
                  <Link href="/admin" className="flex items-center space-x-1 text-gray-600 hover:text-lente-600 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                  <Link href="/users" className="flex items-center space-x-1 text-gray-600 hover:text-lente-600 transition-colors">
                    <Users className="w-4 h-4" />
                    <span>Usuarios</span>
                  </Link>
                  <Link href="/admin/assignments" className="flex items-center space-x-1 text-gray-600 hover:text-lente-600 transition-colors">
                    <Bot className="w-4 h-4" />
                    <span>Asignaciones</span>
                  </Link>
                  <Link href="/agents" className="flex items-center space-x-1 text-gray-600 hover:text-lente-600 transition-colors">
                    <Bot className="w-4 h-4" />
                    <span>Agentes</span>
                  </Link>
                  <Link href="/datastores" className="flex items-center space-x-1 text-gray-600 hover:text-lente-600 transition-colors">
                    <Database className="w-4 h-4" />
                    <span>Datastores</span>
                  </Link>
                </>
              )}
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-lente-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-lente-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {profile?.full_name || user.email}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{profile?.full_name || 'Usuario'}</div>
                      <div className="text-gray-500">{user.email}</div>
                      {profile?.company && (
                        <div className="text-gray-500 text-xs">{profile.company}</div>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Mi Perfil</span>
                      </div>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
