'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showBIPanels, setShowBIPanels] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        {/* Background Image com overlay */}
        <div className="absolute inset-0">
          <Image
            src="/background.jpg"
            alt="Background"
            fill
            className="object-cover blur-sm"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md"></div>
        </div>
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image com overlay */}
      <div className="absolute inset-0">
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover blur-sm"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md"></div>
      </div>

      {/* Efeitos de fundo com degradê animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(236, 33, 42, 0.3) 0%, transparent 70%)',
            top: '-10%',
            left: '-5%',
            animation: 'float-breeze-1 18s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute w-[450px] h-[450px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139, 192, 61, 0.3) 0%, transparent 70%)',
            top: '10%',
            right: '-10%',
            animation: 'float-breeze-2 22s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute w-[520px] h-[520px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(246, 132, 35, 0.3) 0%, transparent 70%)',
            bottom: '-5%',
            left: '20%',
            animation: 'float-breeze-3 20s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute w-[480px] h-[480px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 150, 0.3) 0%, transparent 70%)',
            bottom: '15%',
            right: '10%',
            animation: 'float-breeze-4 24s ease-in-out infinite'
          }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg m-4 p-4 md:p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-20">
                <Image
                  src="/logo.png"
                  alt="ITIV Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              {/* Menu */}
              <nav className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setShowBIPanels(!showBIPanels)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                    showBIPanels 
                      ? 'bg-gradient-to-r from-primary-red/10 via-primary-orange/10 to-primary-purple/10 text-gray-900 border-b-2 border-primary-orange' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">📊</span>
                  <span>Painéis do B.I.</span>
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-gray-800 font-medium">{session.user?.name}</p>
                <p className="text-gray-600 text-sm">{session.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white font-semibold rounded-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Painéis do B.I. */}
        {showBIPanels && (
          <div className="mx-4 mb-4">
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                Painéis do B.I.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card BI IPTU */}
                <div className="bg-gradient-to-br from-primary-red/10 to-primary-orange/10 border-2 border-primary-red/20 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-red/30 to-primary-red/20 flex items-center justify-center">
                      <span className="text-2xl">🏘️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">BI IPTU</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Business Intelligence para análise de dados do IPTU
                  </p>
                </div>

                {/* Card BI TFF */}
                <div className="bg-gradient-to-br from-primary-green/10 to-primary-orange/10 border-2 border-primary-green/20 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-green/30 to-primary-green/20 flex items-center justify-center">
                      <span className="text-2xl">📈</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">BI TFF</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Business Intelligence para análise de dados da TFF
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 - Vermelho */}
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-red/20 to-primary-red/10 flex items-center justify-center group-hover:from-primary-red/30 group-hover:to-primary-red/20 transition-colors">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-3xl font-bold text-gray-800">42</span>
              </div>
              <h3 className="text-gray-800 font-semibold mb-1">Relatórios</h3>
              <p className="text-gray-600 text-sm">Documentos gerados</p>
            </div>

            {/* Card 2 - Verde */}
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-green/20 to-primary-green/10 flex items-center justify-center group-hover:from-primary-green/30 group-hover:to-primary-green/20 transition-colors">
                  <span className="text-2xl">✅</span>
                </div>
                <span className="text-3xl font-bold text-gray-800">89</span>
              </div>
              <h3 className="text-gray-800 font-semibold mb-1">Concluídos</h3>
              <p className="text-gray-600 text-sm">Processos finalizados</p>
            </div>

            {/* Card 3 - Laranja */}
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-orange/20 to-primary-orange/10 flex items-center justify-center group-hover:from-primary-orange/30 group-hover:to-primary-orange/20 transition-colors">
                  <span className="text-2xl">⏳</span>
                </div>
                <span className="text-3xl font-bold text-gray-800">15</span>
              </div>
              <h3 className="text-gray-800 font-semibold mb-1">Pendentes</h3>
              <p className="text-gray-600 text-sm">Aguardando ação</p>
            </div>

            {/* Card 4 - Roxo */}
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-purple/20 to-primary-purple/10 flex items-center justify-center group-hover:from-primary-purple/30 group-hover:to-primary-purple/20 transition-colors">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-3xl font-bold text-gray-800">127</span>
              </div>
              <h3 className="text-gray-800 font-semibold mb-1">Usuários</h3>
              <p className="text-gray-600 text-sm">Ativos no sistema</p>
            </div>
          </div>

          {/* Seção de Atividades Recentes */}
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">Atividades Recentes</span>
            </h2>
            <div className="space-y-4">
              {[
                { icon: '📄', title: 'Novo documento criado', time: 'Há 2 horas', color: 'red' },
                { icon: '✏️', title: 'Processo atualizado', time: 'Há 4 horas', color: 'green' },
                { icon: '👤', title: 'Novo usuário cadastrado', time: 'Há 6 horas', color: 'orange' },
                { icon: '🔔', title: 'Notificação importante', time: 'Há 8 horas', color: 'purple' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary-${activity.color}/20 to-primary-${activity.color}/10 flex items-center justify-center`}>
                    <span className="text-xl">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-800 font-medium">{activity.title}</h4>
                    <p className="text-gray-600 text-sm">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 hover:scale-105 transition-transform duration-300 text-left">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-gray-800 font-semibold mb-2">Novo Documento</h3>
              <p className="text-gray-600 text-sm">Criar novo documento no sistema</p>
            </button>
            <button className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 hover:scale-105 transition-transform duration-300 text-left">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-gray-800 font-semibold mb-2">Pesquisar</h3>
              <p className="text-gray-600 text-sm">Buscar processos e documentos</p>
            </button>
            <button className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-6 hover:scale-105 transition-transform duration-300 text-left">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-gray-800 font-semibold mb-2">Configurações</h3>
              <p className="text-gray-600 text-sm">Ajustar preferências do sistema</p>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
