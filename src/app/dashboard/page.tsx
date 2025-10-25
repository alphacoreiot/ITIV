'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Chatbot from '@/components/Chatbot'
import AppHeader from '@/components/AppHeader'

type FonteNoticias = 'bahia' | 'agencia'

type ResumoRefisResponse = {
  success: boolean
  resumo: {
    totalRegistros: number
    valorTotal: number
    valorArrecadado: number
    valorEmAberto: number
    parcelasTotais: number
    parcelasPagas: number
    parcelasAbertas: number
    acordosAtivos: number
    acordosEmRisco: number
    ultimaAdesao: string | null
    primeiraAdesao: string | null
  }
  statusResumo: Array<{
    status: string
    quantidade: number
    valorNegociado: number
  }>
  distribuicaoParcelas: Array<{
    faixa: string
    quantidade: number
    valorNegociado: number
  }>
  statusFinanceiro: Array<{
    situacao: string
    quantidade: number
    valorNegociado: number
  }>
  participacaoValores: Array<{
    categoria: string
    quantidade: number
    valorNegociado: number
    percentual: number
  }>
  topContribuintes: Array<{
    contribuinte: string
    cpfCnpj: string
    acordos: number
    valorNegociado: number
  }>
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showBIPanels, setShowBIPanels] = useState(false)
  const [noticias, setNoticias] = useState<{ bahia: any[]; agencia: any[] }>({ bahia: [], agencia: [] })
  const [loadingNoticias, setLoadingNoticias] = useState(true)
  const [clima, setClima] = useState<any>(null)
  const [cotacoes, setCotacoes] = useState<any>(null)
  const [loadingCotacoes, setLoadingCotacoes] = useState(true)
  const [fonteNoticias, setFonteNoticias] = useState<FonteNoticias>('bahia')
  const [abaDados, setAbaDados] = useState<'refis' | 'news'>('refis')
  const [refisResumo, setRefisResumo] = useState<ResumoRefisResponse | null>(null)
  const [loadingRefis, setLoadingRefis] = useState(true)
  const [erroRefis, setErroRefis] = useState<string | null>(null)

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
    fetch('/api/noticias')
      .then(res => res.json())
      .then(data => {
        setNoticias({
          bahia: data?.noticias?.bahia || [],
          agencia: data?.noticias?.agencia || []
        })
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
      .then(res => res.json())
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
      .then(res => res.json())
      .then((data: ResumoRefisResponse) => {
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
                      Bem-vindo ao Sistema Camaçari APP
                    </p>
                  </div>
                  
                  {(clima || cotacoes) && (
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
                      {clima && (
                        <div className="flex items-center gap-3 bg-gradient-to-br from-primary-orange/10 to-primary-red/10 border border-primary-orange/30 rounded-xl p-3 md:p-4 min-w-[200px] md:min-w-[230px]">
                          <div className="text-center">
                            <div className="text-3xl md:text-4xl mb-1">
                              {clima.descricao.includes('chuva') ? '🌧️' :
                               clima.descricao.includes('nuvem') ? '☁️' :
                               clima.descricao.includes('limpo') || clima.descricao.includes('sol') ? '☀️' : '🌤️'}
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
                              const variacao = Number(dados.variacao ?? dados.percentual ?? 0)
                              const variacaoPositiva = Number.isFinite(variacao) ? variacao >= 0 : true
                              const percentualValor = Number(dados.percentual ?? dados.porcentagem ?? variacao)
                              const valorVenda = Number(dados.venda ?? dados.preco ?? dados.compra ?? 0)
                              const valorCompra = Number(dados.compra ?? dados.venda ?? dados.preco ?? 0)

                              const percentualFormatado = Number.isFinite(percentualValor) ? percentualValor.toFixed(2) : '0.00'
                              const valorVendaFormatado = Number.isFinite(valorVenda) ? valorVenda.toFixed(2) : '0.00'
                              const valorCompraFormatado = Number.isFinite(valorCompra) ? valorCompra.toFixed(2) : '0.00'

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
                        {refisResumo?.resumo && (
                          <div className="text-xs md:text-sm text-gray-500">
                            <p>Período: {formatDate(refisResumo.resumo.primeiraAdesao)} - {formatDate(refisResumo.resumo.ultimaAdesao)}</p>
                          </div>
                        )}
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
                        <div className="space-y-5 md:space-y-6">
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
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3">Situação dos Acordos</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs md:text-sm text-gray-700">
                                  <thead>
                                    <tr className="border-b border-white/40">
                                      <th className="py-2 pr-2 font-medium">Status</th>
                                      <th className="py-2 pr-2 font-medium text-right">Quantidade</th>
                                      <th className="py-2 font-medium text-right">Valor negociado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/40">
                                    {refisResumo.statusResumo.map(item => (
                                      <tr key={item.status}>
                                        <td className="py-2 pr-2 font-semibold text-gray-800">{item.status}</td>
                                        <td className="py-2 pr-2 text-right">{formatNumber(item.quantidade)}</td>
                                        <td className="py-2 text-right">{formatCurrency(item.valorNegociado)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary-purple/10 via-primary-orange/10 to-white border border-primary-purple/30 rounded-xl p-4 md:p-5 shadow-sm">
                              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3">Resumo Financeiro</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs md:text-sm text-gray-700">
                                  <thead>
                                    <tr className="border-b border-white/40">
                                      <th className="py-2 pr-2 font-medium">Situação</th>
                                      <th className="py-2 pr-2 font-medium text-right">Quantidade</th>
                                      <th className="py-2 font-medium text-right">Valor</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/40">
                                    {refisResumo.statusFinanceiro.map(item => (
                                      <tr key={item.situacao}>
                                        <td className="py-2 pr-2 font-semibold text-gray-800">{item.situacao}</td>
                                        <td className="py-2 pr-2 text-right">{formatNumber(item.quantidade)}</td>
                                        <td className="py-2 text-right">{formatCurrency(item.valorNegociado)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
                          <p className="text-sm md:text-base text-gray-600">Acompanhe as principais informações em tempo real.</p>
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
                        const noticiasAtuais = fonteNoticias === 'bahia' ? noticias.bahia : noticias.agencia

                        if (!noticiasAtuais || noticiasAtuais.length === 0) {
                          return (
                            <div className="py-12 text-center text-gray-500">
                              Não foi possível carregar notícias no momento.
                            </div>
                          )
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {noticiasAtuais.slice(0, 6).map((noticia: any) => {
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
