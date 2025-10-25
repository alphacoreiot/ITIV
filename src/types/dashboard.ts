export type FonteNoticias = 'bahia' | 'agencia'

export interface NoticiaItem {
  id: number
  title: string
  excerpt: string
  url: string
  date: string
  image: string
  source: FonteNoticias
}

export interface NoticiasResponse {
  noticias: Record<FonteNoticias, NoticiaItem[]>
}

export interface ClimaResponse {
  temperatura: number
  sensacao: number
  descricao: string
  umidade: number
  cidade: string
  icone: string
  mock?: boolean
}

export interface CotacaoNormalizada {
  codigo: string
  moeda: string
  compra: number
  venda: number
  variacao: number
  percentual: number
  atualizadoEm: string
}

export interface CotacoesResponse {
  dolar: CotacaoNormalizada
  euro: CotacaoNormalizada
  mock?: boolean
}

export interface ResumoRefisMetrics {
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

export interface StatusResumoItem {
  status: string
  quantidade: number
  valorNegociado: number
}

export interface DistribuicaoParcelasItem {
  faixa: string
  quantidade: number
  valorNegociado: number
}

export interface StatusFinanceiroItem {
  situacao: string
  quantidade: number
  valorNegociado: number
}

export interface ParticipacaoValoresItem {
  categoria: string
  quantidade: number
  valorNegociado: number
  percentual: number
}

export interface TopContribuinteItem {
  contribuinte: string
  cpfCnpj: string
  acordos: number
  valorNegociado: number
}

export interface ResumoRefisResponse {
  success: boolean
  resumo: ResumoRefisMetrics
  statusResumo: StatusResumoItem[]
  distribuicaoParcelas: DistribuicaoParcelasItem[]
  statusFinanceiro: StatusFinanceiroItem[]
  participacaoValores: ParticipacaoValoresItem[]
  topContribuintes: TopContribuinteItem[]
}
