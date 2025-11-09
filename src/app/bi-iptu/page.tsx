'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import AppHeader from '@/components/AppHeader'

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
    let isMounted = true
    let refreshTimer: ReturnType<typeof setTimeout> | undefined

    const fetchToken = async () => {
      try {
        const response = await fetch('/api/metabase/token?dashboard=3')
        if (!response.ok) {
          throw new Error(`Falha ao buscar token Metabase: ${response.status}`)
        }
        const data = await response.json()
        if (!isMounted) return
        setIframeUrl(data.iframeUrl)
        scheduleRefresh(data.expiresInMinutes)
      } catch (err) {
        console.error('Erro ao carregar Metabase:', err)
      }
    }

    function scheduleRefresh(expiresInMinutes: number | undefined) {
      const refreshMs = Math.max(((expiresInMinutes ?? 30) - 1) * 60_000, 5 * 60_000)
      refreshTimer = setTimeout(fetchToken, refreshMs)
    }

    fetchToken()

    const handleFocus = () => fetchToken()
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
      window.removeEventListener('focus', handleFocus)
    }
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
        <AppHeader
          session={session}
          mode="bi"
          onBiAction={() => router.push('/dashboard')}
          biTitle="BI IPTU"
          onLogoClick={() => router.push('/dashboard')}
        />

        {/* Metabase Dashboard */}
        <main className="p-4 flex-1 flex">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl overflow-hidden flex-1 flex flex-col">
            {iframeUrl ? (
              <iframe
                src={iframeUrl}
                frameBorder={0}
                allowTransparency
                className="w-full flex-1 min-h-[65vh]"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[65vh]">
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
                SMART SEFAZ
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
