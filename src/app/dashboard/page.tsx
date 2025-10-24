'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Chatbot from '@/components/Chatbot'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showBIPanels, setShowBIPanels] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [noticias, setNoticias] = useState<any[]>([])
  const [loadingNoticias, setLoadingNoticias] = useState(true)
  const [clima, setClima] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Buscar clima de Camaçari
    fetch('/api/clima')
      .then(res => res.json())
      .then(data => setClima(data))
      .catch(err => console.error('Erro ao carregar clima:', err))
  }, [])

  useEffect(() => {
    // Buscar notícias da SEFAZ
    fetch('/api/noticias')
      .then(res => res.json())
      .then(data => {
        setNoticias(data.noticias || [])
        setLoadingNoticias(false)
      })
      .catch(err => {
        console.error('Erro ao carregar notícias:', err)
        setLoadingNoticias(false)
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        {/* Background Image com overlay */}
        <div className="absolute inset-0">
          <Image
            src="/background.jpg"
            alt="Background"
            fill
            className="object-cover blur-xl"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xl"></div>
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
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image com overlay */}
      <div className="absolute inset-0">
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover blur-xl"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl"></div>
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

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg m-4 p-4 md:p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-8">
              <div className="relative w-auto h-18">
                <Image
                  src="/logo.png"
                  alt="ITIV Logo"
                  width={150}
                  height={72}
                  className="object-contain h-18 w-auto"
                  priority
                />
              </div>
              
              {/* Menu Desktop */}
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

              {/* Botão Menu Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Info Usuário Desktop */}
            {/* Info Usuário Desktop */}
            <div className="hidden md:flex items-center gap-4">
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

          {/* Menu Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setShowBIPanels(!showBIPanels)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-3 font-medium transition-all rounded-lg ${
                    showBIPanels 
                      ? 'bg-gradient-to-r from-primary-red/10 via-primary-orange/10 to-primary-purple/10 text-gray-900 border-l-4 border-primary-orange' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">📊</span>
                  <span>Painéis do B.I.</span>
                </button>
              </nav>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <p className="text-gray-800 font-medium text-sm">{session.user?.name}</p>
                  <p className="text-gray-600 text-xs">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full px-4 py-2 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 flex-1">
          {showBIPanels ? (
            /* Painéis do B.I. */
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                Painéis do B.I.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* Card BI IPTU */}
                <button 
                  onClick={() => router.push('/bi-iptu')}
                  className="bg-gradient-to-br from-primary-red/10 to-primary-orange/10 border-2 border-primary-red/20 rounded-xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-red/30 to-primary-red/20 flex items-center justify-center">
                      <span className="text-3xl">🏘️</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">BI IPTU</h3>
                  </div>
                  <p className="text-gray-600">
                    Business Intelligence para análise de dados do IPTU
                  </p>
                </button>

                {/* Card BI TFF */}
                <button 
                  onClick={() => router.push('/bi-tff')}
                  className="bg-gradient-to-br from-primary-green/10 to-primary-orange/10 border-2 border-primary-green/20 rounded-xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-green/30 to-primary-green/20 flex items-center justify-center">
                      <span className="text-3xl">📈</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">BI TFF</h3>
                  </div>
                  <p className="text-gray-600">
                    Business Intelligence para análise de dados da TFF
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Dashboard Principal com Notícias */
            <div className="space-y-6">
              {/* Card de Boas-vindas com Clima */}
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      Olá, <span className="bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">{session.user?.name}</span>
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Bem-vindo ao Sistema Camaçari APP
                    </p>
                  </div>
                  
                  {/* Card de Clima */}
                  {clima && (
                    <div className="flex items-center gap-4 bg-gradient-to-br from-primary-orange/10 to-primary-red/10 border border-primary-orange/30 rounded-xl p-4 min-w-[280px]">
                      <div className="text-center">
                        <div className="text-5xl mb-2">
                          {clima.descricao.includes('chuva') ? '🌧️' : 
                           clima.descricao.includes('nuvem') ? '☁️' : 
                           clima.descricao.includes('limpo') || clima.descricao.includes('sol') ? '☀️' : '🌤️'}
                        </div>
                        <p className="text-4xl font-bold text-gray-800">{clima.temperatura}°C</p>
                      </div>
                      <div className="border-l border-gray-300 pl-4">
                        <p className="text-lg font-semibold text-gray-800 capitalize">{clima.descricao}</p>
                        <p className="text-sm text-gray-600">Sensação: {clima.sensacao}°C</p>
                        <p className="text-sm text-gray-600">Umidade: {clima.umidade}%</p>
                        <p className="text-xs text-gray-500 mt-1">📍 {clima.cidade}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção de Notícias SEFAZ */}
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                    Notícias SEFAZ Camaçari
                  </h2>
                  <a 
                    href="https://sefaz.camacari.ba.gov.br/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-orange hover:text-primary-red transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    Ver todas
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {loadingNoticias ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {noticias.map((noticia) => {
                      return (
                        <button
                          key={noticia.id}
                          onClick={() => router.push(`/noticia?url=${encodeURIComponent(noticia.url)}`)}
                          className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
                        >
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-medium text-gray-500">
                              📅 {noticia.date}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary-orange transition-colors line-clamp-2">
                            {noticia.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {noticia.excerpt}
                          </p>
                          <div className="mt-4 flex items-center text-primary-orange font-medium text-sm">
                            Ler mais
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    )})}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg m-4 p-4 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>© 2025</span>
              <span className="font-semibold bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                Sistema Camaçari APP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Desenvolvido pela</span>
              <span className="font-semibold bg-gradient-to-r from-primary-purple to-primary-orange bg-clip-text text-transparent">
                SEFAZ TECNOLOGIA
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Chatbot Flutuante */}
      <Chatbot />
    </div>
  )
}
