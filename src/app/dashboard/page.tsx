'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Chatbot from '@/components/Chatbot'
import AppHeader from '@/components/AppHeader'
import type {
  ClimaResponse,
  CotacoesResponse,
  FonteNoticias,
  NoticiaItem,
  NoticiasResponse,
  ResumoRefisResponse,
  AlertasVencimentoResponse
} from '@/types/dashboard'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showBIPanels, setShowBIPanels] = useState(false)
  const [noticias, setNoticias] = useState<Record<FonteNoticias, NoticiaItem[]>>({ bahia: [], agencia: [] })
  const [loadingNoticias, setLoadingNoticias] = useState(true)
  const [clima, setClima] = useState<ClimaResponse | null>(null)
  const [cotacoes, setCotacoes] = useState<CotacoesResponse | null>(null)
  const [loadingCotacoes, setLoadingCotacoes] = useState(true)
  const [fonteNoticias, setFonteNoticias] = useState<FonteNoticias>('bahia')
  const [abaDados, setAbaDados] = useState<'refis' | 'news'>('refis')
  const [subAbaRefis, setSubAbaRefis] = useState<'resumo' | 'alertas'>('resumo')
  const [refisResumo, setRefisResumo] = useState<ResumoRefisResponse | null>(null)
  const [loadingRefis, setLoadingRefis] = useState(true)
  const [erroRefis, setErroRefis] = useState<string | null>(null)
  const [abaAlertas, setAbaAlertas] = useState<'vencidos' | 'prestes' | 'prazo'>('vencidos')
  const [alertasVencimento, setAlertasVencimento] = useState<AlertasVencimentoResponse | null>(null)
  const [loadingAlertas, setLoadingAlertas] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Buscar clima de Camaçari
    fetch('/api/clima')
      .then(res => res.json() as Promise<ClimaResponse>)
      .then(data => setClima(data))
      .catch(err => console.error('Erro ao carregar clima:', err))
  }, [])

  useEffect(() => {
    fetch('/api/noticias')
      .then(res => res.json() as Promise<NoticiasResponse>)
      .then(data => {
        setNoticias(data.noticias)
        setLoadingNoticias(false)
      })
      .catch(err => {
        console.error('Erro ao carregar notícias:', err)
        setNoticias({ bahia: [], agencia: [] })
        setLoadingNoticias(false)
      })
  }, [])

  useEffect(() => {
    fetch('/api/cotacoes')
      .then(res => res.json() as Promise<CotacoesResponse>)
      .then(data => {
        setCotacoes(data)
        setLoadingCotacoes(false)
      })
      .catch(err => {
        console.error('Erro ao carregar cotações:', err)
        setCotacoes(null)
        setLoadingCotacoes(false)
      })
  }, [])

  useEffect(() => {
    setLoadingRefis(true)
    fetch('/api/refis/resumo')
      .then(res => res.json() as Promise<ResumoRefisResponse>)
      .then(data => {
        if (data?.success) {
          setRefisResumo(data)
          setErroRefis(null)
        } else {
          setRefisResumo(null)
          setErroRefis('Não foi possível carregar o resumo do REFIS.')
        }
      })
      .catch(err => {
        console.error('Erro ao carregar resumo do REFIS:', err)
        setRefisResumo(null)
        setErroRefis('Erro ao carregar resumo do REFIS.')
      })
      .finally(() => {
        setLoadingRefis(false)
      })
  }, [])

  useEffect(() => {
    setLoadingAlertas(true)
    fetch('/api/refis/alertas')
      .then(res => res.json() as Promise<AlertasVencimentoResponse>)
      .then(data => {
        if (data?.success) {
          setAlertasVencimento(data)
        } else {
          setAlertasVencimento(null)
        }
      })
      .catch(err => {
        console.error('Erro ao carregar alertas de vencimento:', err)
        setAlertasVencimento(null)
      })
      .finally(() => {
        setLoadingAlertas(false)
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

  const climaDescricao = clima?.descricao?.toLowerCase() ?? ''

  const formatCotacaoHora = (iso?: string) => {
    if (!iso) return '-'
    const data = new Date(iso)
    if (Number.isNaN(data.getTime())) return '-'
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatCurrency = (valor: number) => {
    if (!Number.isFinite(valor)) return 'R$ 0,00'
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatNumber = (valor: number) => {
    if (!Number.isFinite(valor)) return '0'
    return valor.toLocaleString('pt-BR')
  }

  const formatPercent = (valor: number) => {
    if (!Number.isFinite(valor)) return '0%'
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  }

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    const data = new Date(iso)
    if (Number.isNaN(data.getTime())) return '-'
    return data.toLocaleDateString('pt-BR')
  }

  const quickResumoRefis = refisResumo?.resumo
    ? [
        {
          label: 'Adesões registradas',
          value: formatNumber(refisResumo.resumo.totalRegistros),
          helper: `Última adesão: ${formatDate(refisResumo.resumo.ultimaAdesao)}`
        },
        {
          label: 'Valor negociado',
          value: formatCurrency(refisResumo.resumo.valorTotal),
          helper: `Arrecadado: ${formatCurrency(refisResumo.resumo.valorArrecadado)}`
        },
        {
          label: 'Valor em aberto',
          value: formatCurrency(refisResumo.resumo.valorEmAberto),
          helper: `${formatNumber(refisResumo.resumo.parcelasAbertas)} parcelas pendentes`
        },
        {
          label: 'Acordos ativos',
          value: formatNumber(refisResumo.resumo.acordosAtivos),
          helper: `${formatNumber(refisResumo.resumo.acordosEmRisco)} em risco`
        }
      ]
    : []

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
        <AppHeader
          session={session}
          mode="dashboard"
          onBiAction={() => setShowBIPanels(prev => !prev)}
          biActionActive={showBIPanels}
        />

        {/* Main Content */}
        <main className="p-3 md:p-6 flex-1">
          {showBIPanels ? (
            /* Painéis do B.I. */
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-5 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-5 md:mb-6 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                Painéis do B.I.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Card BI IPTU */}
                <button 
                  onClick={() => router.push('/bi-iptu')}
                  className="bg-gradient-to-br from-primary-red/10 to-primary-orange/10 border-2 border-primary-red/20 rounded-xl p-5 md:p-7 hover:scale-105 transition-transform duration-300 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary-red/30 to-primary-red/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl">🏘️</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800">BI IPTU</h3>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base">
                    Business Intelligence para análise de dados do IPTU
                  </p>
                </button>

                {/* Card BI TFF */}
                <button 
                  onClick={() => router.push('/bi-tff')}
                  className="bg-gradient-to-br from-primary-green/10 to-primary-orange/10 border-2 border-primary-green/20 rounded-xl p-5 md:p-7 hover:scale-105 transition-transform duration-300 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary-green/30 to-primary-green/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl">📈</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800">BI TFF</h3>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base">
                    Business Intelligence para análise de dados da TFF
                  </p>
                </button>

                {/* Card BI REFIS */}
                <button 
                  onClick={() => router.push('/bi-refis')}
                  className="bg-gradient-to-br from-primary-purple/10 via-primary-red/10 to-primary-orange/10 border-2 border-primary-purple/20 rounded-xl p-5 md:p-7 hover:scale-105 transition-transform duration-300 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary-purple/30 to-primary-red/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl">💼</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800">BI REFIS</h3>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base">
                    Business Intelligence para acompanhamento dos acordos do REFIS
                  </p>
                </button>

                {/* Card BI REFIS - Percentual de Entrada */}
                <button 
                  onClick={() => router.push('/bi-refis-percentuais')}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 md:p-7 hover:scale-105 transition-transform duration-300 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-blue-400/30 to-indigo-400/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl">📊</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800">BI REFIS - Percentual de Entrada</h3>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base">
                    Análise de Percentuais de Entrada do REFIS 2025
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Dashboard Principal com Notícias */
            <div className="space-y-5 md:space-y-6">
              {/* Card de Boas-vindas com Clima */}
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-5 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-1.5 md:mb-2">
                      Olá, <span className="bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">{session.user?.name}</span>
                    </h2>
                    <p className="text-gray-600 text-base md:text-lg">
                      Bem-vindo ao SMART SEFAZ
                    </p>
                  </div>
                  
                  {(clima || cotacoes) && (
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
                      {clima && (
                        <div className="flex items-center gap-3 bg-gradient-to-br from-primary-orange/10 to-primary-red/10 border border-primary-orange/30 rounded-xl p-3 md:p-4 min-w-[200px] md:min-w-[230px]">
                          <div className="text-center">
                            <div className="text-3xl md:text-4xl mb-1">
                              {climaDescricao.includes('chuva') ? '🌧️' :
                               climaDescricao.includes('nuvem') ? '☁️' :
                               climaDescricao.includes('limpo') || climaDescricao.includes('sol') ? '☀️' : '🌤️'}
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-gray-800">{clima.temperatura}°C</p>
                          </div>
                          <div className="border-l border-gray-300 pl-3">
                            <p className="text-sm md:text-base font-semibold text-gray-800 capitalize">{clima.descricao}</p>
                            <p className="text-xs text-gray-600">Sensação: {clima.sensacao}°C</p>
                            <p className="text-xs text-gray-600">Umidade: {clima.umidade}%</p>
                            <p className="text-[11px] text-gray-500 mt-1">📍 {clima.cidade}</p>
                          </div>
                        </div>
                      )}

                      {cotacoes && cotacoes.dolar && cotacoes.euro && (
                        <div className="flex-1 bg-gradient-to-br from-primary-purple/10 via-primary-green/10 to-primary-orange/10 border border-primary-purple/30 rounded-xl p-3 md:p-4 min-w-[200px] md:min-w-[230px]">
                          <div className="flex items-center justify-between mb-1.5 md:mb-2">
                            <span className="text-sm font-semibold text-gray-800">Cotações</span>
                            {!loadingCotacoes && (
                              <span className="text-[11px] text-gray-500">Atualizado às {formatCotacaoHora(cotacoes.dolar.atualizadoEm)}</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
                            {[{
                              label: 'Dólar',
                              dados: cotacoes.dolar
                            }, {
                              label: 'Euro',
                              dados: cotacoes.euro
                            }].map(({ label, dados }) => {
                              const variacao = Number.isFinite(dados.variacao) ? dados.variacao : 0
                              const variacaoPositiva = variacao >= 0
                              const percentualValor = Number.isFinite(dados.percentual) ? dados.percentual : variacao
                              const valorVenda = Number.isFinite(dados.venda) ? dados.venda : dados.compra
                              const valorCompra = Number.isFinite(dados.compra) ? dados.compra : dados.venda

                              const percentualFormatado = percentualValor.toFixed(2)
                              const valorVendaFormatado = valorVenda.toFixed(2)
                              const valorCompraFormatado = valorCompra.toFixed(2)

                              return (
                                <div key={label} className="bg-white/70 rounded-lg p-2.5 md:p-3 shadow-sm">
                                  <div className="flex items-center justify-between text-[11px] md:text-xs font-semibold text-gray-700">
                                    <span>{label}</span>
                                    <span className={variacaoPositiva ? 'text-primary-green flex items-center gap-1' : 'text-primary-red flex items-center gap-1'}>
                                      {variacaoPositiva ? '▲' : '▼'} {percentualFormatado}%
                                    </span>
                                  </div>
                                  <p className="text-lg md:text-xl font-bold text-gray-900 mt-1">R$ {valorVendaFormatado}</p>
                                  <p className="text-[11px] text-gray-500">Compra: R$ {valorCompraFormatado}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-5 md:p-8">
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setAbaDados('refis')}
                      className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 ${
                        abaDados === 'refis'
                          ? 'bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white shadow'
                          : 'bg-white text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Resumo do REFIS
                    </button>
                    <button
                      onClick={() => setAbaDados('news')}
                      className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 ${
                        abaDados === 'news'
                          ? 'bg-gradient-to-r from-primary-purple via-primary-orange to-primary-red text-white shadow'
                          : 'bg-white text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Notícias
                    </button>
                  </div>
                </div>

                <div className="mt-5 md:mt-6">
                  {abaDados === 'refis' ? (
                    <>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4 mb-5 md:mb-6">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                            Resumo REFIS 2025
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">Panorama atualizado dos acordos e da arrecadação do REFIS 2025</p>
                        </div>
                      </div>

                      {/* Sub-abas: Resumo Geral | Alertas de Vencimento */}
                      <div className="mb-5 md:mb-6">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 border border-gray-200 flex-wrap">
                          <button
                            onClick={() => setSubAbaRefis('resumo')}
                            className={`px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                              subAbaRefis === 'resumo'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-base md:text-lg">📊</span>
                            <span>Resumo Geral</span>
                          </button>
                          <button
                            onClick={() => setSubAbaRefis('alertas')}
                            className={`px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                              subAbaRefis === 'alertas'
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-base md:text-lg">⚠️</span>
                            <span>Alertas de Vencimento</span>
                            {!loadingAlertas && alertasVencimento && (alertasVencimento.totais.vencidos + alertasVencimento.totais.prestesVencer) > 0 && (
                              <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold">
                                {alertasVencimento.totais.vencidos + alertasVencimento.totais.prestesVencer}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {loadingRefis ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
                        </div>
                      ) : erroRefis ? (
                        <div className="py-10 text-center text-sm md:text-base text-red-500 font-medium">
                          {erroRefis}
                        </div>
                      ) : refisResumo ? (
                        <>
                          {/* Conteúdo baseado na sub-aba selecionada */}
                          {subAbaRefis === 'resumo' ? (
                            /* RESUMO GERAL */
                            <div id="painel-resumo-geral" className="space-y-5 md:space-y-6">
                              <style>{`
                                #painel-resumo-geral:fullscreen {
                                  background: linear-gradient(to bottom right, rgb(249 250 251), rgb(255 255 255));
                                  padding: 2rem;
                                  overflow-y: auto;
                                }
                                #painel-resumo-geral:fullscreen::before {
                                  content: '';
                                  position: fixed;
                                  top: 2rem;
                                  left: 2rem;
                                  width: 150px;
                                  height: 70px;
                                  background-image: url('/logo.png');
                                  background-size: contain;
                                  background-repeat: no-repeat;
                                  background-position: left center;
                                  z-index: 1000;
                                  opacity: 0.95;
                                }
                                #painel-resumo-geral:fullscreen::after {
                                  content: 'SMART SEFAZ - Resultados Inteligentes | © 2025 Prefeitura de Camaçari';
                                  position: fixed;
                                  bottom: 0;
                                  left: 0;
                                  right: 0;
                                  background: linear-gradient(to right, rgba(236, 33, 42, 0.95), rgba(246, 132, 35, 0.95), rgba(124, 58, 150, 0.95));
                                  color: white;
                                  text-align: center;
                                  padding: 1rem 2rem;
                                  font-size: 0.875rem;
                                  font-weight: 600;
                                  z-index: 1000;
                                  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
                                }
                              `}</style>
                              
                              {/* Botão Tela Cheia */}
                              <div className="flex justify-end mb-2">
                                <button
                                  onClick={() => {
                                    const element = document.getElementById('painel-resumo-geral')
                                    if (element) {
                                      if (document.fullscreenElement) {
                                        document.exitFullscreen()
                                      } else {
                                        element.requestFullscreen().catch(err => {
                                          console.error('Erro ao entrar em tela cheia:', err)
                                        })
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-primary-orange to-primary-red hover:from-primary-red hover:to-primary-orange text-white rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 text-sm font-semibold hover:scale-105"
                                  title="Alternar Tela Cheia (ESC para sair)"
                                >
                                  <span className="text-lg">⛶</span>
                                  <span className="hidden sm:inline">Tela Cheia</span>
                                </button>
                              </div>

                              {quickResumoRefis.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                                  {quickResumoRefis.map(item => (
                                    <div key={item.label} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                                      <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
                                      <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{item.value}</p>
                                      <p className="text-xs md:text-sm text-gray-500 mt-2">{item.helper}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                            <div className="bg-gradient-to-br from-primary-orange/10 via-primary-red/5 to-white border border-primary-orange/30 rounded-xl p-4 md:p-5 shadow-sm">
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-4">📊 Resumo Executivo</h4>
                              <div className="space-y-4">
                                {/* Adesões */}
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 mb-2">💼 ADESÕES:</p>
                                  <div className="space-y-1 text-xs text-gray-700">
                                    <div className="flex justify-between">
                                      <span>Total de acordos:</span>
                                      <span className="font-semibold">{formatNumber(refisResumo.resumo.totalRegistros)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Acordos ativos:</span>
                                      <span className="font-semibold">{formatNumber(refisResumo.resumo.acordosAtivos)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Em risco:</span>
                                      <span className="font-semibold text-red-600">{formatNumber(refisResumo.resumo.acordosEmRisco)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Valores */}
                                <div className="pt-2 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-2">💰 VALORES:</p>
                                  <div className="space-y-1 text-xs text-gray-700">
                                    <div className="flex justify-between">
                                      <span>Negociado:</span>
                                      <span className="font-semibold">{formatCurrency(refisResumo.resumo.valorTotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Arrecadado:</span>
                                      <span className="font-semibold text-green-600">{formatCurrency(refisResumo.resumo.valorArrecadado)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Em aberto:</span>
                                      <span className="font-semibold text-orange-600">{formatCurrency(refisResumo.resumo.valorEmAberto)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Taxa de arrecadação:</span>
                                      <span className="font-semibold text-blue-600">
                                        {formatPercent((refisResumo.resumo.valorArrecadado / refisResumo.resumo.valorTotal) * 100)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary-purple/10 via-primary-orange/10 to-white border border-primary-purple/30 rounded-xl p-4 md:p-5 shadow-sm">
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-4">📑 Parcelamento</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs md:text-sm text-gray-600">Total de parcelas:</span>
                                  <span className="text-sm md:text-base font-bold text-gray-800">
                                    {formatNumber(refisResumo.resumo.parcelasPagas + refisResumo.resumo.parcelasAbertas)}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs md:text-sm text-gray-600">Pagas:</span>
                                  <span className="text-sm md:text-base font-bold text-green-600">
                                    {formatNumber(refisResumo.resumo.parcelasPagas)} ({formatPercent((refisResumo.resumo.parcelasPagas / (refisResumo.resumo.parcelasPagas + refisResumo.resumo.parcelasAbertas)) * 100)})
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs md:text-sm text-gray-600">Abertas:</span>
                                  <span className="text-sm md:text-base font-bold text-orange-600">
                                    {formatNumber(refisResumo.resumo.parcelasAbertas)}
                                  </span>
                                </div>

                                {/* Barra de progresso */}
                                <div className="pt-2">
                                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                                      style={{ 
                                        width: `${((refisResumo.resumo.parcelasPagas / (refisResumo.resumo.parcelasPagas + refisResumo.resumo.parcelasAbertas)) * 100).toFixed(1)}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary-green/10 via-primary-orange/10 to-white border border-primary-green/30 rounded-xl p-4 md:p-5 shadow-sm">
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3">Faixa de Parcelamento</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs md:text-sm text-gray-700">
                                  <thead>
                                    <tr className="border-b border-white/40">
                                      <th className="py-2 pr-2 font-medium">Faixa</th>
                                      <th className="py-2 pr-2 font-medium text-right">Quantidade</th>
                                      <th className="py-2 font-medium text-right">Valor negociado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/40">
                                    {refisResumo.distribuicaoParcelas.map(item => (
                                      <tr key={item.faixa}>
                                        <td className="py-2 pr-2 font-semibold text-gray-800">{item.faixa}</td>
                                        <td className="py-2 pr-2 text-right">{formatNumber(item.quantidade)}</td>
                                        <td className="py-2 text-right">{formatCurrency(item.valorNegociado)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary-red/10 via-primary-purple/10 to-white border border-primary-red/30 rounded-xl p-4 md:p-5 shadow-sm">
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3">Participação no Total</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs md:text-sm text-gray-700">
                                  <thead>
                                    <tr className="border-b border-white/40">
                                      <th className="py-2 pr-2 font-medium">Categoria</th>
                                      <th className="py-2 pr-2 font-medium text-right">Quantidade</th>
                                      <th className="py-2 pr-2 font-medium text-right">Valor</th>
                                      <th className="py-2 font-medium text-right">Participação</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/40">
                                    {refisResumo.participacaoValores.map(item => (
                                      <tr key={item.categoria}>
                                        <td className="py-2 pr-2 font-semibold text-gray-800">{item.categoria}</td>
                                        <td className="py-2 pr-2 text-right">{formatNumber(item.quantidade)}</td>
                                        <td className="py-2 pr-2 text-right">{formatCurrency(item.valorNegociado)}</td>
                                        <td className="py-2 text-right font-semibold text-primary-purple">{formatPercent(item.percentual)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 via-white to-primary-orange/5 border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm lg:col-span-2 xl:col-span-2">
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3">Top Contribuintes</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs md:text-sm text-gray-700">
                                  <thead>
                                    <tr className="border-b border-gray-200/70">
                                      <th className="py-2 pr-2 font-medium">Contribuinte</th>
                                      <th className="py-2 pr-2 font-medium">CPF/CNPJ</th>
                                      <th className="py-2 pr-2 font-medium text-right">Acordos</th>
                                      <th className="py-2 font-medium text-right">Valor negociado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200/70">
                                    {refisResumo.topContribuintes.map(item => (
                                      <tr key={`${item.contribuinte}-${item.cpfCnpj}`}>
                                        <td className="py-2 pr-2 font-semibold text-gray-800">{item.contribuinte}</td>
                                        <td className="py-2 pr-2 text-gray-600">{item.cpfCnpj}</td>
                                        <td className="py-2 pr-2 text-right">{formatNumber(item.acordos)}</td>
                                        <td className="py-2 text-right">{formatCurrency(item.valorNegociado)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ALERTAS DE VENCIMENTO */
                        <div className="space-y-5 md:space-y-6">
                          {!loadingAlertas && alertasVencimento && (
                            <div id="painel-alertas" className="scroll-mt-20">
                              <style>{`
                                #painel-alertas:fullscreen {
                                  background: linear-gradient(to bottom right, rgb(254 242 242), rgb(255 247 237), rgb(254 252 232));
                                  padding: 2rem;
                                  overflow-y: auto;
                                }
                                #painel-alertas:fullscreen::before {
                                  content: '';
                                  position: absolute;
                                  top: 3rem;
                                  left: 50%;
                                  transform: translateX(-50%);
                                  width: 150px;
                                  height: 70px;
                                  background-image: url('/logo.png');
                                  background-size: contain;
                                  background-repeat: no-repeat;
                                  background-position: center;
                                  z-index: 10;
                                  opacity: 0.95;
                                }
                                #painel-alertas:fullscreen::after {
                                  content: 'SMART SEFAZ - Resultados Inteligentes | © 2025 Prefeitura de Camaçari';
                                  position: fixed;
                                  bottom: 0;
                                  left: 0;
                                  right: 0;
                                  background: linear-gradient(to right, rgba(236, 33, 42, 0.95), rgba(246, 132, 35, 0.95), rgba(124, 58, 150, 0.95));
                                  color: white;
                                  text-align: center;
                                  padding: 1rem 2rem;
                                  font-size: 0.875rem;
                                  font-weight: 600;
                                  z-index: 1000;
                                  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
                                }
                                #painel-alertas:fullscreen .max-h-\\[600px\\] {
                                  max-height: calc(100vh - 400px);
                                }
                              `}</style>
                              <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-2 border-red-200 rounded-xl p-5 md:p-6 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                      <span className="text-2xl">⚠️</span>
                                    </div>
                                    <div>
                                      <h4 className="text-lg md:text-xl font-bold text-gray-800">Alertas de Vencimento</h4>
                                      <p className="text-xs md:text-sm text-gray-600">Monitoramento de prazos e inadimplências</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const element = document.getElementById('painel-alertas')
                                      if (element) {
                                        if (document.fullscreenElement) {
                                          document.exitFullscreen()
                                        } else {
                                          element.requestFullscreen().catch(err => {
                                            console.error('Erro ao entrar em tela cheia:', err)
                                          })
                                        }
                                      }
                                    }}
                                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md border border-gray-200 transition-all duration-200 flex items-center gap-2 text-sm font-semibold hover:scale-105"
                                    title="Alternar Tela Cheia (ESC para sair)"
                                  >
                                    <span className="text-lg">⛶</span>
                                    <span className="hidden sm:inline">Tela Cheia</span>
                                  </button>
                                </div>

                                {/* Abas de Alertas */}
                                <div className="flex items-center gap-2 bg-white rounded-xl p-1 mb-4 flex-wrap">
                                  <button
                                    onClick={() => setAbaAlertas('vencidos')}
                                    className={`flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                      abaAlertas === 'vencidos'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span>🔴</span>
                                      <span>Vencidos</span>
                                      <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                        {alertasVencimento.totais.vencidos}
                                      </span>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => setAbaAlertas('prestes')}
                                    className={`flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                      abaAlertas === 'prestes'
                                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span>⚠️</span>
                                      <span>Prestes a Vencer</span>
                                      <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                        {alertasVencimento.totais.prestesVencer}
                                      </span>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => setAbaAlertas('prazo')}
                                    className={`flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                      abaAlertas === 'prazo'
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span>✅</span>
                                      <span>Dentro do Prazo</span>
                                      <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                        {alertasVencimento.totais.dentroPrazo}
                                      </span>
                                    </div>
                                  </button>
                                </div>

                                {/* Cards de Resumo por Aba */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                  <div className={`rounded-lg p-4 ${
                                    abaAlertas === 'vencidos' ? 'bg-red-100 border-2 border-red-300' : 'bg-white border border-gray-200'
                                  }`}>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Total Vencido</p>
                                    <p className="text-lg font-bold text-red-600">{formatCurrency(alertasVencimento.totais.valorVencido)}</p>
                                    <p className="text-xs text-gray-500 mt-1">{alertasVencimento.totais.vencidos} contribuintes</p>
                                  </div>

                                  <div className={`rounded-lg p-4 ${
                                    abaAlertas === 'prestes' ? 'bg-orange-100 border-2 border-orange-300' : 'bg-white border border-gray-200'
                                  }`}>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Prestes a Vencer</p>
                                    <p className="text-lg font-bold text-orange-600">{formatCurrency(alertasVencimento.totais.valorPrestesVencer)}</p>
                                    <p className="text-xs text-gray-500 mt-1">{alertasVencimento.totais.prestesVencer} contribuintes</p>
                                  </div>

                                  <div className={`rounded-lg p-4 ${
                                    abaAlertas === 'prazo' ? 'bg-green-100 border-2 border-green-300' : 'bg-white border border-gray-200'
                                  }`}>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Dentro do Prazo</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(alertasVencimento.totais.valorDentroPrazo)}</p>
                                    <p className="text-xs text-gray-500 mt-1">{alertasVencimento.totais.dentroPrazo} contribuintes</p>
                                  </div>
                                </div>

                                {/* Tabela de Alertas */}
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-left text-xs md:text-sm">
                                      <thead className={`sticky top-0 z-10 ${
                                        abaAlertas === 'vencidos' ? 'bg-red-500' :
                                        abaAlertas === 'prestes' ? 'bg-orange-500' :
                                        'bg-green-500'
                                      } text-white`}>
                                        <tr>
                                          <th className="py-3 px-3 font-semibold">Contribuinte</th>
                                          <th className="py-3 px-3 font-semibold">CPF/CNPJ</th>
                                          <th className="py-3 px-3 font-semibold">Email</th>
                                          <th className="py-3 px-3 font-semibold">Telefone</th>
                                          <th className="py-3 px-3 font-semibold text-right">Valor Total</th>
                                          <th className="py-3 px-3 font-semibold text-center">Vencimento</th>
                                          <th className="py-3 px-3 font-semibold text-center">Dias</th>
                                          <th className="py-3 px-3 font-semibold">Situação</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {(() => {
                                          const dados = abaAlertas === 'vencidos' ? alertasVencimento.vencidos :
                                                       abaAlertas === 'prestes' ? alertasVencimento.prestesVencer :
                                                       alertasVencimento.dentroPrazo

                                          if (dados.length === 0) {
                                            return (
                                              <tr>
                                                <td colSpan={8} className="py-8 text-center text-gray-500">
                                                  Nenhum registro nesta categoria
                                                </td>
                                              </tr>
                                            )
                                          }

                                          return dados.map((item, index) => (
                                            <tr key={`${item.cpfCnpj}-${index}`} className="hover:bg-gray-50 transition-colors">
                                              <td className="py-3 px-3 font-semibold text-gray-800">{item.contribuinte}</td>
                                              <td className="py-3 px-3 text-gray-600">{item.cpfCnpj}</td>
                                              <td className="py-3 px-3 text-gray-600 text-xs">
                                                {item.email !== 'Não informado' ? (
                                                  <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">
                                                    {item.email}
                                                  </a>
                                                ) : (
                                                  <span className="text-gray-400 italic">{item.email}</span>
                                                )}
                                              </td>
                                              <td className="py-3 px-3 text-gray-600">
                                                {item.telefone !== 'Não informado' ? (
                                                  <a href={`tel:${item.telefone}`} className="text-blue-600 hover:underline">
                                                    {item.telefone}
                                                  </a>
                                                ) : (
                                                  <span className="text-gray-400 italic">{item.telefone}</span>
                                                )}
                                              </td>
                                              <td className="py-3 px-3 text-right font-semibold text-gray-800">
                                                {formatCurrency(item.valorTotalNegociado)}
                                              </td>
                                              <td className="py-3 px-3 text-center text-gray-600">
                                                {new Date(item.dtVencimento).toLocaleDateString('pt-BR')}
                                              </td>
                                              <td className="py-3 px-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                  item.diasAtraso > 0 ? 'bg-red-100 text-red-700' :
                                                  item.diasAtraso >= -5 && item.diasAtraso <= 0 ? 'bg-orange-100 text-orange-700' :
                                                  'bg-green-100 text-green-700'
                                                }`}>
                                                  {item.diasAtraso > 0 ? `+${item.diasAtraso}` : item.diasAtraso}
                                                </span>
                                              </td>
                                              <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                  item.situacaoPagamento === 'QUITADO' ? 'bg-green-100 text-green-700' :
                                                  item.situacaoPagamento === 'NÃO PAGOU' ? 'bg-red-100 text-red-700' :
                                                  'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                  {item.situacaoPagamento}
                                                </span>
                                              </td>
                                            </tr>
                                          ))
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Rodapé com Informações */}
                                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                                  <span>💡 Vencimento: data de lançamento + 10 dias</span>
                                  <span className="font-semibold">
                                    {(() => {
                                      const total = abaAlertas === 'vencidos' ? alertasVencimento.totais.vencidos :
                                                   abaAlertas === 'prestes' ? alertasVencimento.totais.prestesVencer :
                                                   alertasVencimento.totais.dentroPrazo
                                      return `Mostrando ${total} registro${total !== 1 ? 's' : ''} • Ordenado por maior valor`
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-10 text-center text-sm md:text-base text-gray-500">
                      Nenhum dado do REFIS encontrado para exibir.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-5 md:mb-6">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent">
                            Notícias
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
                            {(['bahia', 'agencia'] as FonteNoticias[]).map(fonte => {
                            const isActive = fonteNoticias === fonte
                            const label = fonte === 'bahia' ? 'Governo da Bahia' : 'Agência Brasil Economia'
                            return (
                              <button
                                key={fonte}
                                onClick={() => setFonteNoticias(fonte)}
                                className={`px-3 py-1 text-xs md:text-sm font-medium rounded-lg transition-all ${
                                  isActive ? 'bg-white text-primary-orange shadow' : 'text-gray-600 hover:text-gray-800'
                                }`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                        <a
                          href={
                            fonteNoticias === 'bahia'
                              ? 'https://www.ba.gov.br/comunicacao/noticias'
                              : 'https://agenciabrasil.ebc.com.br/economia'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-orange hover:text-primary-red transition-colors text-xs md:text-sm font-medium flex items-center gap-2 md:ml-auto"
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
                      ) : (() => {
                        const noticiasAtuais: NoticiaItem[] = fonteNoticias === 'bahia' ? noticias.bahia : noticias.agencia

                        if (!noticiasAtuais || noticiasAtuais.length === 0) {
                          return (
                            <div className="py-12 text-center text-gray-500">
                              Não foi possível carregar notícias no momento.
                            </div>
                          )
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {noticiasAtuais.slice(0, 6).map((noticia: NoticiaItem) => {
                              const imageSrc = noticia.image && noticia.image !== '' ? noticia.image : '/logo.png'
                              const sourceLabel = noticia.source === 'bahia' ? 'Governo da Bahia' : 'Agência Brasil'

                              return (
                                <button
                                  key={noticia.url}
                                  onClick={() => router.push(`/noticia?url=${encodeURIComponent(noticia.url)}&fonte=${noticia.source}`)}
                                  className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
                                >
                                  <div className="relative h-36 md:h-40 w-full overflow-hidden">
                                    <Image
                                      src={imageSrc}
                                      alt={noticia.title}
                                      fill
                                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                    <div className="absolute bottom-2 left-3 flex items-center gap-2 text-xs font-medium text-white/90">
                                      <span className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                                        {sourceLabel}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        📅 {noticia.date}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-5 md:p-6">
                                    <h4 className="text-base md:text-lg font-bold text-gray-800 mb-2.5 md:mb-3 line-clamp-2 group-hover:text-primary-orange transition-colors">
                                      {noticia.title}
                                    </h4>
                                    <p className="text-gray-600 text-sm line-clamp-3 mb-3 md:mb-4">
                                      {noticia.excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center text-primary-orange font-medium text-xs md:text-sm">
                                      Ler mais
                                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg m-3 md:m-4 p-3 md:p-4 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
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

      {/* Chatbot Flutuante */}
      <Chatbot />
    </div>
  )
}
