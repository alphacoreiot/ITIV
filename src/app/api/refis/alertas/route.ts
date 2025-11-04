import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { AlertasVencimentoResponse, AlertaVencimentoItem } from '@/types/dashboard'

const pool = new Pool({
  host: '10.0.20.61',
  port: 5432,
  database: 'metabase',
  user: 'postgres',
  password: 'CEnIg8shcyeF',
})

export async function GET(request: Request) {
  console.log('[ALERTAS API] ==> Requisição recebida')
  
  try {
    const { searchParams } = new URL(request.url)
    const percentual = searchParams.get('percentual')

    console.log('[ALERTAS API] Percentual filtro:', percentual)

    // Teste: verificar se tabela existe primeiro
    const testQuery = `SELECT * FROM tb_refis_analitico_2025 LIMIT 1`
    
    console.log('[ALERTAS API] Testando acesso à tb_refis_analitico_2025...')
    
    const testResult = await pool.query(testQuery)
    
    console.log('[ALERTAS API] ✓ Tabela acessível. Colunas:', Object.keys(testResult.rows[0] || {}))

    // Query EXATA fornecida pelo usuário com JOIN para email e telefone
    const baseQuery = `
      SELECT
        a.contribuinte,
        a.cpf_cnpj,
        COALESCE(c.email, 'Não informado') as email,
        COALESCE(c.telefone, 'Não informado') as telefone,
        a.tipo_pessoa,
        a.vl_total_negociado,
        a.vl_arrecadado,
        a.situacao_pagamento,
        a.qtd_parcelas_total,
        a.qtd_parcelas_pagas,
        a.perc_parcelas_pagas,
        a.vl_parcela_media,
        a.faixa_parcelamento,
        a.cidade,
        a.bairro,
        a.dtlancamento,
        a.dtlancamento + INTERVAL '10 days' AS dt_vencimento,
        CURRENT_DATE - (a.dtlancamento + INTERVAL '10 days')::date AS dias_atraso
      FROM
        tb_refis_analitico_2025 a
      LEFT JOIN
        tb_refis_dados_complementares c ON a.cpf_cnpj = c.cpf_cnpj
      WHERE
        a.dtlancamento IS NOT NULL
        AND a.situacao_pagamento != 'QUITADO'
      ORDER BY
        a.vl_total_negociado DESC
      LIMIT 1000
    `

    console.log('[ALERTAS API] Executando query com tb_refis_analitico_2025...')

    const result = await pool.query(baseQuery)

    console.log('[ALERTAS API] ✓ Registros encontrados:', result.rows.length)

    // Categorizar por faixas usando BETWEEN logic
    const vencidos: AlertaVencimentoItem[] = []
    const prestesVencer: AlertaVencimentoItem[] = []
    const dentroPrazo: AlertaVencimentoItem[] = []

    let valorVencido = 0
    let valorPrestesVencer = 0
    let valorDentroPrazo = 0

    result.rows.forEach((row) => {
      const item: AlertaVencimentoItem = {
        contribuinte: row.contribuinte || 'Não informado',
        cpfCnpj: row.cpf_cnpj || '',
        email: row.email || 'Não informado',
        telefone: row.telefone || 'Não informado',
        tipoPessoa: row.tipo_pessoa || '',
        valorTotalNegociado: parseFloat(row.vl_total_negociado) || 0,
        valorArrecadado: parseFloat(row.vl_arrecadado) || 0,
        situacaoPagamento: row.situacao_pagamento || '',
        qtdParcelasTotal: parseInt(row.qtd_parcelas_total) || 0,
        qtdParcelasPagas: parseInt(row.qtd_parcelas_pagas) || 0,
        percParcelasPagas: parseFloat(row.perc_parcelas_pagas) || 0,
        valorParcelaMedia: parseFloat(row.vl_parcela_media) || 0,
        faixaParcelamento: row.faixa_parcelamento || '',
        cidade: row.cidade || '',
        bairro: row.bairro || '',
        dtLancamento: row.dtlancamento,
        dtVencimento: row.dt_vencimento,
        diasAtraso: parseInt(row.dias_atraso) || 0,
        percentualEntrada: 0, // Coluna não existe na tabela
      }

      const diasAtraso = item.diasAtraso

      // Categorização com lógica BETWEEN
      if (diasAtraso >= 1) {
        // Vencidos: dias_atraso BETWEEN 1 AND 9999
        vencidos.push(item)
        valorVencido += item.valorTotalNegociado
      } else if (diasAtraso >= -5 && diasAtraso <= 0) {
        // Prestes a Vencer: dias_atraso BETWEEN -5 AND 0
        prestesVencer.push(item)
        valorPrestesVencer += item.valorTotalNegociado
      } else if (diasAtraso < -5) {
        // Dentro do Prazo: dias_atraso < -5
        dentroPrazo.push(item)
        valorDentroPrazo += item.valorTotalNegociado
      }
    })

    // Ordenar por valor total negociado (DESC)
    vencidos.sort((a, b) => b.valorTotalNegociado - a.valorTotalNegociado)
    prestesVencer.sort((a, b) => b.valorTotalNegociado - a.valorTotalNegociado)
    dentroPrazo.sort((a, b) => b.valorTotalNegociado - a.valorTotalNegociado)

    console.log('[ALERTAS API] Resultado (DADOS REAIS):')
    console.log('  - Vencidos:', vencidos.length, '| Valor:', valorVencido)
    console.log('  - Prestes a vencer:', prestesVencer.length, '| Valor:', valorPrestesVencer)
    console.log('  - Dentro do prazo:', dentroPrazo.length, '| Valor:', valorDentroPrazo)

    const response: AlertasVencimentoResponse = {
      success: true,
      vencidos,
      prestesVencer,
      dentroPrazo,
      totais: {
        vencidos: vencidos.length,
        prestesVencer: prestesVencer.length,
        dentroPrazo: dentroPrazo.length,
        valorVencido,
        valorPrestesVencer,
        valorDentroPrazo,
      },
    }

    console.log('[ALERTAS API] ✓ Resposta enviada com sucesso')

    return NextResponse.json(response)
  } catch (error) {
    console.error('[ALERTAS API] ❌ ERRO:', error)
    console.error('[ALERTAS API] Stack:', (error as Error).stack)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar alertas de vencimento',
        details: (error as Error).message,
        vencidos: [],
        prestesVencer: [],
        dentroPrazo: [],
        totais: {
          vencidos: 0,
          prestesVencer: 0,
          dentroPrazo: 0,
          valorVencido: 0,
          valorPrestesVencer: 0,
          valorDentroPrazo: 0,
        }
      },
      { status: 500 }
    )
  }
}
