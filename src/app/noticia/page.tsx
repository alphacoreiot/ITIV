'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function NoticiaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const url = searchParams.get('url')
  const fonte = searchParams.get('fonte') as 'bahia' | 'agencia' | null
  
  const [noticia, setNoticia] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!url) {
      router.push('/dashboard')
      return
    }

    const query = new URLSearchParams({ url: url ?? '' })
    if (fonte) {
      query.set('fonte', fonte)
    }

    fetch(`/api/noticia-completa?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        setNoticia(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erro ao carregar notícia:', err)
        setLoading(false)
      })
  }, [url, router])

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

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg m-4 p-4 md:p-6 rounded-2xl">
          <div className="flex items-center gap-8">
            <div className="relative w-auto h-18 cursor-pointer" onClick={() => router.push('/dashboard')}>
              <Image
                src="/logo.png"
                alt="ITIV Logo"
                width={150}
                height={72}
                className="object-contain h-18 w-auto"
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
                {fonte === 'bahia' ? 'Notícia • Governo da Bahia' : 'Notícia • Agência Brasil Economia'}
              </h1>
            </div>
          </div>
        </header>

        {/* Conteúdo da Notícia */}
        <main className="p-4 md:p-6 flex-1">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-8 max-w-4xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando notícia...</p>
                </div>
              </div>
            ) : noticia?.error ? (
              <div className="text-center py-20">
                <p className="text-red-600 mb-4">Erro ao carregar notícia</p>
                {url && (
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-orange hover:text-primary-red"
                  >
                    Abrir no site original
                  </a>
                )}
              </div>
            ) : (
              <>
                {noticia?.date && (
                  <div className="text-sm text-gray-500 mb-4">
                    📅 {noticia.date}
                  </div>
                )}
                
                {noticia?.title && (
                  <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                    {noticia.title}
                  </h1>
                )}

                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: noticia?.content || '' }}
                  style={{
                    color: '#374151',
                    lineHeight: '1.8'
                  }}
                />

                {url && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-orange hover:text-primary-red transition-colors font-medium"
                    >
                      Ver notícia original {fonte === 'bahia' ? 'no portal do Governo da Bahia' : 'na Agência Brasil'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </>
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
