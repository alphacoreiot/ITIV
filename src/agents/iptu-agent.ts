import { Pool } from 'pg'

export interface IPTUOption {
  id: string
  label: string
  description: string
  query: string
  formatResponse: (rows: any[]) => string
}

export const IPTU_OPTIONS: Record<string, IPTUOption> = {
  resumo_geral: {
    id: 'resumo_geral',
    label: '📊 Resumo Geral 2025',
    description: 'Visão completa: total arrecadado (IPTU+COSIP+TRSD), contribuintes, cota única vs parcelado',
    query: `
      SELECT 
        cota_unica,
        ROUND(COALESCE(SUM(vl_arrecadado), 0)::numeric, 2) as total_arrecadado,
        COUNT(DISTINCT inscricao_municipal) as qtd_contribuintes,
        ROUND(AVG(vl_arrecadado)::numeric, 2) as media_por_contribuinte
      FROM tb_arrec_iptu_2025
      WHERE ano_base = 2025 AND tributo IN ('IPTU', 'COSIP', 'TRSD')
      GROUP BY cota_unica
      ORDER BY cota_unica DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado para IPTU 2025.'
      }

      const cotaUnica = rows.find(r => r.cota_unica === 'SIM')
      const parcelado = rows.find(r => r.cota_unica === 'NÃO')
      
      const totalGeral = Number(cotaUnica?.total_arrecadado || 0) + Number(parcelado?.total_arrecadado || 0)
      const contribGeral = Number(cotaUnica?.qtd_contribuintes || 0) + Number(parcelado?.qtd_contribuintes || 0)

      return `📊 **IPTU 2025 - Resumo Geral**
ℹ️ *Inclui IPTU + COSIP + TRSD*

💰 **Total Arrecadado**: ${formatCurrency(totalGeral)}
👥 **Contribuintes**: ${formatNumber(contribGeral)}

**Cota Única:**
• Arrecadado: ${formatCurrency(cotaUnica?.total_arrecadado)}
• Contribuintes: ${formatNumber(cotaUnica?.qtd_contribuintes)}
• Média: ${formatCurrency(cotaUnica?.media_por_contribuinte)}

**Parcelado:**
• Arrecadado: ${formatCurrency(parcelado?.total_arrecadado)}
• Contribuintes: ${formatNumber(parcelado?.qtd_contribuintes)}
• Média: ${formatCurrency(parcelado?.media_por_contribuinte)}

📈 Taxa de adesão cota única: ${((Number(cotaUnica?.qtd_contribuintes) / contribGeral) * 100).toFixed(1)}%`
    }
  },

  arrecadacao_por_bairro: {
    id: 'arrecadacao_por_bairro',
    label: '🏘️ Arrecadação por Bairro',
    description: 'Top 10 bairros que mais arrecadaram (IPTU+COSIP+TRSD) em 2025',
    query: `
      SELECT 
        bairro,
        COUNT(DISTINCT inscricao_municipal) as qtd_contribuintes,
        ROUND(SUM(vl_arrecadado)::numeric, 2) as total_arrecadado,
        ROUND(AVG(vl_arrecadado)::numeric, 2) as media_por_contribuinte
      FROM tb_arrec_iptu_2025
      WHERE tributo IN ('IPTU', 'COSIP', 'TRSD') AND ano_base = 2025
      GROUP BY bairro
      ORDER BY total_arrecadado DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado de bairros encontrado.'
      }

      let response = '🏘️ **Top 10 Bairros - IPTU 2025**\n\n'
      
      rows.forEach((row, index) => {
        response += `**${index + 1}. ${row.bairro || 'Não informado'}**\n`
        response += `   💰 Arrecadado: ${formatCurrency(row.total_arrecadado)}\n`
        response += `   👥 Contribuintes: ${formatNumber(row.qtd_contribuintes)}\n`
        response += `   📊 Média: ${formatCurrency(row.media_por_contribuinte)}\n\n`
      })

      return response
    }
  },

  historico_5_anos: {
    id: 'historico_5_anos',
    label: '📈 Histórico 2020-2025',
    description: 'Evolução da arrecadação (IPTU+COSIP+TRSD) nos últimos 5 anos',
    query: `
      SELECT 
        ano_base,
        COUNT(DISTINCT inscricao_municipal) as qtd_contribuintes,
        ROUND(SUM(vl_arrecadado)::numeric, 2) as vl_total_arrecadado
      FROM tb_arrec_iptu_5_anos
      WHERE tributo IN ('IPTU', 'COSIP', 'TRSD')
      GROUP BY ano_base
      ORDER BY ano_base
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum histórico encontrado.'
      }

      let response = '📈 **Evolução IPTU (2020-2025)**\n\n'
      
      rows.forEach((row) => {
        response += `**${row.ano_base}**\n`
        response += `   💰 ${formatCurrency(row.vl_total_arrecadado)}\n`
        response += `   👥 ${formatNumber(row.qtd_contribuintes)} contribuintes\n\n`
      })

      // Calcular crescimento
      if (rows.length >= 2) {
        const primeiro = rows[0]
        const ultimo = rows[rows.length - 1]
        const crescimento = ((Number(ultimo.vl_total_arrecadado) / Number(primeiro.vl_total_arrecadado) - 1) * 100).toFixed(1)
        response += `📊 Crescimento total: ${crescimento}% (${primeiro.ano_base} → ${ultimo.ano_base})`
      }

      return response
    }
  },

  maiores_pagadores: {
    id: 'maiores_pagadores',
    label: '🏆 Top 10 Maiores Pagadores',
    description: 'Contribuintes que mais pagaram IPTU em 2025',
    query: `
      SELECT 
        'COTA ÚNICA' as modalidade,
        codigo_entidade,
        nome_razao_responsavel_tributario as contribuinte,
        documento_responsavel_tributario as documento,
        ROUND(vl_lan_2025::numeric, 2) as vl_lancado,
        ROUND(vl_total_arrecadado_pgto_cota_unica_2025::numeric, 2) as vl_pago
      FROM tb_cota_unica_iptu_2025
      ORDER BY vl_total_arrecadado_pgto_cota_unica_2025 DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum pagador encontrado.'
      }

      let response = '🏆 **Top 10 Maiores Pagadores IPTU 2025**\n\n'
      
      rows.forEach((row, index) => {
        response += `**${index + 1}. ${row.contribuinte}**\n`
        response += `   📋 Inscrição: ${row.codigo_entidade}\n`
        response += `   💰 Valor Pago: ${formatCurrency(row.vl_pago)}\n`
        response += `   📊 Lançado: ${formatCurrency(row.vl_lancado)}\n`
        response += `   ✅ Modalidade: ${row.modalidade}\n\n`
      })

      return response
    }
  },

  maiores_devedores: {
    id: 'maiores_devedores',
    label: '⚠️ Top 10 Maiores Devedores',
    description: 'Contribuintes com maior dívida de IPTU em 2025',
    query: `
      SELECT 
        inscricao,
        contribuinte,
        COUNT(*) as qtd_lancamentos,
        ROUND(SUM(vl_original)::numeric, 2) as divida_total,
        string_agg(DISTINCT situacao_parcela, ', ') as situacoes
      FROM tb_maiores_devedores_iptu_2025
      WHERE ano_base = 2025
      GROUP BY inscricao, contribuinte
      ORDER BY divida_total DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '✅ Nenhum devedor encontrado - ótima notícia!'
      }

      let response = '⚠️ **Top 10 Maiores Devedores IPTU 2025**\n\n'
      let totalDivida = 0
      
      rows.forEach((row, index) => {
        totalDivida += Number(row.divida_total)
        response += `**${index + 1}. ${row.contribuinte}**\n`
        response += `   📋 Inscrição: ${row.inscricao}\n`
        response += `   💸 Dívida: ${formatCurrency(row.divida_total)}\n`
        response += `   📑 Lançamentos: ${row.qtd_lancamentos}\n`
        response += `   📍 Situação: ${row.situacoes}\n\n`
      })

      response += `💰 **Dívida Total (Top 10)**: ${formatCurrency(totalDivida)}`

      return response
    }
  },

  comparativo_2024_2025: {
    id: 'comparativo_2024_2025',
    label: '🔄 Comparativo 2024 x 2025',
    description: 'Análise comparativa da arrecadação (IPTU+COSIP+TRSD) entre 2024 e 2025',
    query: `
      SELECT 
        ano_base,
        COUNT(DISTINCT inscricao_municipal) as qtd_contribuintes,
        ROUND(SUM(vl_arrecadado)::numeric, 2) as total_arrecadado
      FROM tb_arrec_iptu_2024_2025
      WHERE tributo IN ('IPTU', 'COSIP', 'TRSD')
      GROUP BY ano_base
      ORDER BY ano_base
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length < 2) {
        return '❌ Dados insuficientes para comparação.'
      }

      const ano2024 = rows.find(r => r.ano_base === 2024)
      const ano2025 = rows.find(r => r.ano_base === 2025)

      if (!ano2024 || !ano2025) {
        return '❌ Dados incompletos para comparação.'
      }

      const crescimentoValor = ((Number(ano2025.total_arrecadado) / Number(ano2024.total_arrecadado) - 1) * 100)
      const crescimentoContrib = ((Number(ano2025.qtd_contribuintes) / Number(ano2024.qtd_contribuintes) - 1) * 100)

      return `🔄 **Comparativo 2024 x 2025**
ℹ️ *Inclui IPTU + COSIP + TRSD*

**2024:**
• 💰 Arrecadado: ${formatCurrency(ano2024.total_arrecadado)}
• 👥 Contribuintes: ${formatNumber(ano2024.qtd_contribuintes)}

**2025:**
• 💰 Arrecadado: ${formatCurrency(ano2025.total_arrecadado)}
• 👥 Contribuintes: ${formatNumber(ano2025.qtd_contribuintes)}

📊 **Crescimento:**
• Valor: ${crescimentoValor > 0 ? '+' : ''}${crescimentoValor.toFixed(2)}%
• Contribuintes: ${crescimentoContrib > 0 ? '+' : ''}${crescimentoContrib.toFixed(2)}%

${crescimentoValor > 0 ? '📈 Crescimento positivo na arrecadação!' : '📉 Queda na arrecadação - atenção necessária.'}`
    }
  }
}

export async function executeIPTUQuery(optionId: string, pool: Pool): Promise<string> {
  const option = IPTU_OPTIONS[optionId]
  
  if (!option) {
    throw new Error(`Opção IPTU inválida: ${optionId}`)
  }

  try {
    const result = await pool.query(option.query)
    return option.formatResponse(result.rows)
  } catch (error: any) {
    console.error(`Erro ao executar consulta IPTU ${optionId}:`, error)
    throw new Error(`Erro ao consultar dados de IPTU: ${error.message}`)
  }
}

export function getIPTUMenu(): string {
  return `🏠 **Especialista em IPTU (IPTU + COSIP + TRSD) - Escolha uma opção:**

${Object.values(IPTU_OPTIONS).map((opt, index) => 
  `${index + 1}. ${opt.label}\n   ${opt.description}`
).join('\n\n')}

0. 🔙 Voltar ao menu principal

Digite o número da opção desejada:`
}

// Funções auxiliares de formatação
function formatCurrency(value: any): string {
  const num = Number(value)
  if (isNaN(num)) return 'R$ 0,00'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumber(value: any): string {
  const num = Number(value)
  if (isNaN(num)) return '0'
  return num.toLocaleString('pt-BR')
}
