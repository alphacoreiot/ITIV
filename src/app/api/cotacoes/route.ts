import { NextResponse } from 'next/server'

type AwesomeApiQuote = {
  code: string
  codein: string
  name: string
  bid: string
  ask: string
  varBid: string
  pctChange: string
  timestamp: string
}

type CotacaoNormalizada = {
  codigo: string
  moeda: string
  compra: number
  venda: number
  variacao: number
  percentual: number
  atualizadoEm: string
}

const parseQuote = (quote: AwesomeApiQuote): CotacaoNormalizada => {
  const timestamp = Number.parseInt(quote.timestamp, 10)

  return {
    codigo: `${quote.code}/${quote.codein}`,
    moeda: quote.name,
    compra: Number.parseFloat(quote.bid),
    venda: Number.parseFloat(quote.ask),
    variacao: Number.parseFloat(quote.varBid),
    percentual: Number.parseFloat(quote.pctChange),
    atualizadoEm: Number.isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp * 1000).toISOString()
  }
}

export async function GET() {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL', {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Erro na API de cotações: ${response.status}`)
    }

    const data = await response.json() as Record<string, AwesomeApiQuote>
    const dolar = data?.USDBRL
    const euro = data?.EURBRL

    if (!dolar || !euro) {
      throw new Error('Resposta incompleta da API de cotações')
    }

    return NextResponse.json({
      dolar: parseQuote(dolar),
      euro: parseQuote(euro)
    })
  } catch (error) {
    console.error('Erro ao buscar cotações:', error)

    const agora = new Date()
    const fallbackAtualizado = new Date(agora.getTime() - 60 * 60 * 1000).toISOString()

    return NextResponse.json({
      dolar: {
        codigo: 'USD/BRL',
        moeda: 'Dólar Comercial',
        compra: 5.02,
        venda: 5.08,
        variacao: 0.03,
        percentual: 0.60,
        atualizadoEm: fallbackAtualizado
      },
      euro: {
        codigo: 'EUR/BRL',
        moeda: 'Euro',
        compra: 5.45,
        venda: 5.52,
        variacao: -0.02,
        percentual: -0.36,
        atualizadoEm: fallbackAtualizado
      },
      mock: true
    })
  }
}
