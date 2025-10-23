'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center liquid-bg">
        <div className="glass-effect p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen liquid-bg">
      {/* Efeitos de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-red/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-green/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-primary-orange/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-primary-purple/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="glass-effect m-4 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-16">
                <Image
                  src="/logo.png"
                  alt="ITIV Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Sistema ITIV</h1>
                <p className="text-white/70 text-sm">Gestão Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-medium">{session.user?.name}</p>
                <p className="text-white/60 text-sm">{session.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="glass-button text-white"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 - Vermelho */}
            <div className="glass-effect p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary-red/30 flex items-center justify-center group-hover:bg-primary-red/50 transition-colors">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-3xl font-bold text-white">42</span>
              </div>
              <h3 className="text-white/90 font-semibold mb-1">Relatórios</h3>
              <p className="text-white/60 text-sm">Documentos gerados</p>
            </div>

            {/* Card 2 - Verde */}
            <div className="glass-effect p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary-green/30 flex items-center justify-center group-hover:bg-primary-green/50 transition-colors">
                  <span className="text-2xl">✅</span>
                </div>
                <span className="text-3xl font-bold text-white">89</span>
              </div>
              <h3 className="text-white/90 font-semibold mb-1">Concluídos</h3>
              <p className="text-white/60 text-sm">Processos finalizados</p>
            </div>

            {/* Card 3 - Laranja */}
            <div className="glass-effect p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary-orange/30 flex items-center justify-center group-hover:bg-primary-orange/50 transition-colors">
                  <span className="text-2xl">⏳</span>
                </div>
                <span className="text-3xl font-bold text-white">15</span>
              </div>
              <h3 className="text-white/90 font-semibold mb-1">Pendentes</h3>
              <p className="text-white/60 text-sm">Aguardando ação</p>
            </div>

            {/* Card 4 - Roxo */}
            <div className="glass-effect p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary-purple/30 flex items-center justify-center group-hover:bg-primary-purple/50 transition-colors">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-3xl font-bold text-white">127</span>
              </div>
              <h3 className="text-white/90 font-semibold mb-1">Usuários</h3>
              <p className="text-white/60 text-sm">Ativos no sistema</p>
            </div>
          </div>

          {/* Seção de Atividades Recentes */}
          <div className="glass-effect p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="gradient-text">Atividades Recentes</span>
            </h2>
            <div className="space-y-4">
              {[
                { icon: '📄', title: 'Novo documento criado', time: 'Há 2 horas', color: 'primary-red' },
                { icon: '✏️', title: 'Processo atualizado', time: 'Há 4 horas', color: 'primary-green' },
                { icon: '👤', title: 'Novo usuário cadastrado', time: 'Há 6 horas', color: 'primary-orange' },
                { icon: '🔔', title: 'Notificação importante', time: 'Há 8 horas', color: 'primary-purple' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-full bg-${activity.color}/30 flex items-center justify-center`}>
                    <span className="text-xl">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{activity.title}</h4>
                    <p className="text-white/50 text-sm">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="glass-effect p-6 hover:scale-105 transition-transform duration-300 text-left">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-white font-semibold mb-2">Novo Documento</h3>
              <p className="text-white/60 text-sm">Criar novo documento no sistema</p>
            </button>
            <button className="glass-effect p-6 hover:scale-105 transition-transform duration-300 text-left">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-white font-semibold mb-2">Pesquisar</h3>
              <p className="text-white/60 text-sm">Buscar processos e documentos</p>
            </button>
            <button className="glass-effect p-6 hover:scale-105 transition-transform duration-300 text-left">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-white font-semibold mb-2">Configurações</h3>
              <p className="text-white/60 text-sm">Ajustar preferências do sistema</p>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
