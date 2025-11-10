'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

interface Module {
  moduloId: string
  nome: string
  caminho: string
  temPermissao: boolean
  permissoes: string[]
}

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [hasPermission, setHasPermission] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const checkPermission = async () => {
      // Rotas públicas que não precisam verificação
      const publicRoutes = ['/login', '/api']
      if (publicRoutes.some(route => pathname.startsWith(route))) {
        setHasPermission(true)
        setIsChecking(false)
        return
      }

      // Se não estiver autenticado, redireciona para login
      if (status === 'unauthenticated') {
        router.push('/login')
        return
      }

      // Se ainda está carregando, aguarda
      if (status === 'loading') {
        setIsChecking(true)
        return
      }

      // Se está autenticado, verifica permissões
      if (status === 'authenticated' && session?.user) {
        setIsChecking(true)
        try {
          const response = await fetch('/api/permissions')
          const data = await response.json()

          if (data.success && data.modules) {
            // Verifica se tem permissão para a rota atual
            const currentModule = data.modules.find((m: Module) => 
              pathname.startsWith(m.caminho)
            )

            if (currentModule) {
              if (!currentModule.temPermissao) {
                setHasPermission(false)
                setIsChecking(false)
                return
              }
            }
          }

          setHasPermission(true)
          setIsChecking(false)
        } catch (error) {
          console.error('Erro ao verificar permissões:', error)
          // Em caso de erro, permite acesso para não bloquear o usuário
          setHasPermission(true)
          setIsChecking(false)
        }
      }
    }

    checkPermission()
  }, [session, status, pathname, router])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar este módulo.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
