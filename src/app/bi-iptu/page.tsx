'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function BiIptuPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [iframeUrl, setIframeUrl] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Buscar o token do Metabase
    fetch('/api/metabase/token?dashboard=3')
      .then(res => res.json())
      .then(data => setIframeUrl(data.iframeUrl))
      .catch(err => console.error('Erro ao carregar Metabase:', err))
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
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
    <div className="min-h-screen relative overflow-hidden flex flex-col">
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
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg m-4 p-4 md:p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-8">
              <div className="relative w-auto h-24 cursor-pointer" onClick={() => router.push('/dashboard')}>
                <Image
                  src="/logo.png"
                  alt="ITIV Logo"
                  width={200}
                  height={96}
                  className="object-contain h-24 w-auto"
                  priority
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Voltar</span>
                </button>
                <span className="text-gray-300">|</span>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                  BI IPTU
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Metabase Dashboard */}
        <main className="p-4 flex-1">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
            {iframeUrl ? (
              <iframe
                src={iframeUrl}
                frameBorder={0}
                width="100%"
                height="800"
                allowTransparency
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-[800px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando painel...</p>
                </div>
              </div>
            )}
          </div>
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
    </div>
  )
}
