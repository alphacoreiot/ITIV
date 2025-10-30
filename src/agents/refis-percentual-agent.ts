import { Pool } from 'pg'

export interface RefisPercentualOption {
  id: string
  label: string
  description: string
  query: string
  formatResponse: (rows: any[]) => string
}

export const REFIS_PERCENTUAL_OPTIONS: Record<string, RefisPercentualOption> = {
  resumo_geral: {
    id: 'resumo_geral',
    label: '📊 Resumo Geral por Percentual',
    description: 'Visão executiva de todos os percentuais de entrada (10% a 100%)',
    query: `
      SELECT 
        percentual_entrada,
        COUNT(*) AS qtd_contribuintes,
        ROUND(SUM(vl_total_negociado), 2) AS vl_total_negociado,
        ROUND(AVG(vl_total_negociado), 2) AS vl_medio_por_contribuinte,
        ROUND(SUM(vl_arrecadado), 2) AS vl_arrecadado,
        ROUND(SUM(vl_desconto_obtido), 2) AS vl_total_desconto
      FROM tb_refis_analitico_2025
      GROUP BY percentual_entrada
      ORDER BY percentual_entrada DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado.'
      }

      let response = '📊 **REFIS - Resumo Geral por Percentual de Entrada**\n\n'
      
      rows.forEach(row => {
        const percArrecadado = row.vl_total_negociado > 0 
          ? (Number(row.vl_arrecadado) / Number(row.vl_total_negociado)) * 100 
          : 0

        response += `**${row.percentual_entrada}% de Entrada:**\n`
        response += `   👥 Contribuintes: ${formatNumber(row.qtd_contribuintes)}\n`
        response += `   💰 Negociado: ${formatCurrency(row.vl_total_negociado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado)} (${percArrecadado.toFixed(1)}%)\n`
        response += `   💵 Média/contrib.: ${formatCurrency(row.vl_medio_por_contribuinte)}\n`
        response += `   🎁 Desconto total: ${formatCurrency(row.vl_total_desconto)}\n\n`
      })

      return response
    }
  },

  entrada_100: {
    id: 'entrada_100',
    label: '💯 Entrada 100% - À Vista',
    description: 'Análise completa dos contribuintes que optaram por pagamento 100% à vista',
    query: `
      SELECT 
        situacao_pagamento,
        COUNT(*) AS qtd_contribuintes,
        ROUND(SUM(vl_total_negociado), 2) AS vl_total,
        ROUND(SUM(vl_arrecadado), 2) AS vl_arrecadado,
        ROUND(
          (SUM(vl_arrecadado) / NULLIF(SUM(vl_total_negociado), 0)) * 100, 2
        ) AS perc_arrecadado
      FROM tb_refis_analitico_2025
      WHERE percentual_entrada = 100.0
      GROUP BY situacao_pagamento
      ORDER BY qtd_contribuintes DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado para entrada 100%.'
      }

      let response = '💯 **Entrada 100% - Análise de Pagamentos**\n\n'
      
      let totalContrib = 0
      let totalNegociado = 0
      let totalArrecadado = 0

      rows.forEach(row => {
        totalContrib += Number(row.qtd_contribuintes)
        totalNegociado += Number(row.vl_total)
        totalArrecadado += Number(row.vl_arrecadado)

        const emoji = row.situacao_pagamento === 'QUITADO' ? '✅' : 
                     row.situacao_pagamento === 'NÃO PAGOU' ? '❌' : '⏳'

        response += `${emoji} **${row.situacao_pagamento}:**\n`
        response += `   👥 ${formatNumber(row.qtd_contribuintes)} contribuintes\n`
        response += `   💰 Negociado: ${formatCurrency(row.vl_total)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado)} (${row.perc_arrecadado}%)\n\n`
      })

      response += `📈 **TOTAL GERAL:**\n`
      response += `   👥 ${formatNumber(totalContrib)} contribuintes\n`
      response += `   💰 ${formatCurrency(totalNegociado)} negociado\n`
      response += `   ✅ ${formatCurrency(totalArrecadado)} arrecadado (${((totalArrecadado/totalNegociado)*100).toFixed(1)}%)\n`

      return response
    }
  },

  top_quitados_100: {
    id: 'top_quitados_100',
    label: '🏆 Top 10 Quitados 100%',
    description: 'Maiores valores quitados no pagamento à vista (100%)',
    query: `
      SELECT 
        contribuinte,
        cpf_cnpj,
        tipo_pessoa,
        vl_total_negociado,
        vl_arrecadado,
        vl_desconto_obtido,
        percentual_desconto,
        dtlancamento,
        dtquitacao,
        cidade
      FROM tb_refis_analitico_2025
      WHERE percentual_entrada = 100.0
        AND situacao_pagamento = 'QUITADO'
      ORDER BY vl_total_negociado DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhuma quitação 100% encontrada.'
      }

      let response = '🏆 **Top 10 - Quitações 100% à Vista**\n\n'
      
      rows.forEach((row, index) => {
        response += `**${index + 1}. ${row.contribuinte}**\n`
        response += `   📋 ${row.cpf_cnpj} (${row.tipo_pessoa})\n`
        response += `   💰 Negociado: ${formatCurrency(row.vl_total_negociado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado)}\n`
        response += `   🎁 Desconto: ${formatCurrency(row.vl_desconto_obtido)} (${row.percentual_desconto}%)\n`
        response += `   📍 ${row.cidade || 'Não informado'}\n`
        response += `   📅 Quitação: ${formatDate(row.dtquitacao)}\n\n`
      })

      return response
    }
  },

  inadimplentes_100: {
    id: 'inadimplentes_100',
    label: '⚠️ Inadimplentes 100%',
    description: 'Contribuintes que optaram por 100% mas não pagaram',
    query: `
      SELECT 
        contribuinte,
        cpf_cnpj,
        tipo_pessoa,
        vl_total_negociado,
        qtd_parcelas_total,
        qtd_parcelas_pagas,
        dtlancamento,
        cidade,
        bairro,
        status_refis
      FROM tb_refis_analitico_2025
      WHERE percentual_entrada = 100.0
        AND situacao_pagamento = 'NÃO PAGOU'
      ORDER BY vl_total_negociado DESC
      LIMIT 20
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '✅ Nenhum inadimplente encontrado para entrada 100%!'
      }

      let response = '⚠️ **Inadimplentes - Entrada 100% à Vista**\n\n'
      let totalValor = 0
      
      rows.forEach((row, index) => {
        totalValor += Number(row.vl_total_negociado)
        
        response += `**${index + 1}. ${row.contribuinte}**\n`
        response += `   📋 ${row.cpf_cnpj} (${row.tipo_pessoa})\n`
        response += `   💰 Valor: ${formatCurrency(row.vl_total_negociado)}\n`
        response += `   📍 ${row.cidade || 'N/I'} - ${row.bairro || 'N/I'}\n`
        response += `   📅 Adesão: ${formatDate(row.dtlancamento)}\n`
        response += `   🔖 Status: ${row.status_refis}\n\n`
      })

      response += `💰 **Total inadimplente:** ${formatCurrency(totalValor)}\n`

      return response
    }
  },

  analise_inadimplencia: {
    id: 'analise_inadimplencia',
    label: '📉 Análise de Inadimplência',
    description: 'Cruzamento: percentual de entrada x situação de pagamento',
    query: `
      SELECT 
        percentual_entrada,
        situacao_pagamento,
        COUNT(*) AS qtd_contribuintes,
        ROUND(SUM(vl_total_negociado), 2) AS vl_total_negociado,
        ROUND(SUM(vl_arrecadado), 2) AS vl_arrecadado,
        ROUND(
          (COUNT(*)::numeric / (SELECT COUNT(*) FROM tb_refis_analitico_2025)) * 100, 2
        ) AS perc_do_total
      FROM tb_refis_analitico_2025
      GROUP BY percentual_entrada, situacao_pagamento
      ORDER BY percentual_entrada DESC, situacao_pagamento
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado.'
      }

      let response = '📉 **Análise de Inadimplência por Percentual**\n\n'
      
      let currentPercentual: number | null = null
      
      rows.forEach(row => {
        if (currentPercentual !== row.percentual_entrada) {
          if (currentPercentual !== null) response += '\n'
          response += `**${row.percentual_entrada}% de Entrada:**\n`
          currentPercentual = row.percentual_entrada
        }

        const emoji = row.situacao_pagamento === 'QUITADO' ? '✅' : 
                     row.situacao_pagamento === 'NÃO PAGOU' ? '❌' : '⏳'

        response += `   ${emoji} ${row.situacao_pagamento}: ${formatNumber(row.qtd_contribuintes)} (${row.perc_do_total}% do total)\n`
        response += `      💰 ${formatCurrency(row.vl_total_negociado)} | Arrec.: ${formatCurrency(row.vl_arrecadado)}\n`
      })

      return response
    }
  },

  top_maiores_adesoes: {
    id: 'top_maiores_adesoes',
    label: '🥇 Top 20 Maiores Adesões',
    description: 'Ranking dos maiores valores negociados (todos os percentuais)',
    query: `
      SELECT 
        percentual_entrada,
        contribuinte,
        cpf_cnpj,
        tipo_pessoa,
        vl_total_negociado,
        vl_arrecadado,
        situacao_pagamento,
        qtd_parcelas_total,
        qtd_parcelas_pagas,
        perc_parcelas_pagas,
        cidade
      FROM tb_refis_analitico_2025
      ORDER BY vl_total_negociado DESC
      LIMIT 20
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado.'
      }

      let response = '🥇 **Top 20 - Maiores Adesões REFIS 2025**\n\n'
      
      rows.forEach((row, index) => {
        const emoji = row.situacao_pagamento === 'QUITADO' ? '✅' : 
                     row.situacao_pagamento === 'NÃO PAGOU' ? '❌' : '⏳'

        response += `**${index + 1}. ${row.contribuinte}** (${row.percentual_entrada}% entrada)\n`
        response += `   📋 ${row.cpf_cnpj} (${row.tipo_pessoa})\n`
        response += `   💰 Negociado: ${formatCurrency(row.vl_total_negociado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado)}\n`
        response += `   ${emoji} ${row.situacao_pagamento}\n`
        response += `   📦 Parcelas: ${row.qtd_parcelas_pagas}/${row.qtd_parcelas_total} (${row.perc_parcelas_pagas}%)\n`
        response += `   📍 ${row.cidade || 'N/I'}\n\n`
      })

      return response
    }
  },

  analise_pf_pj: {
    id: 'analise_pf_pj',
    label: '👥 PF vs PJ por Percentual',
    description: 'Comparação Pessoa Física x Pessoa Jurídica por percentual de entrada',
    query: `
      SELECT 
        percentual_entrada,
        tipo_pessoa,
        COUNT(*) AS qtd_contribuintes,
        ROUND(SUM(vl_total_negociado), 2) AS vl_total,
        ROUND(AVG(vl_total_negociado), 2) AS vl_medio,
        ROUND(SUM(vl_arrecadado), 2) AS vl_arrecadado,
        ROUND(
          (SUM(vl_arrecadado) / NULLIF(SUM(vl_total_negociado), 0)) * 100, 2
        ) AS perc_arrecadado
      FROM tb_refis_analitico_2025
      GROUP BY percentual_entrada, tipo_pessoa
      ORDER BY percentual_entrada DESC, tipo_pessoa
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado.'
      }

      let response = '👥 **Análise PF vs PJ por Percentual de Entrada**\n\n'
      
      let currentPercentual: number | null = null
      
      rows.forEach(row => {
        if (currentPercentual !== row.percentual_entrada) {
          if (currentPercentual !== null) response += '\n'
          response += `**${row.percentual_entrada}% de Entrada:**\n`
          currentPercentual = row.percentual_entrada
        }

        const emoji = row.tipo_pessoa === 'FISICA' ? '👤' : '🏢'

        response += `   ${emoji} ${row.tipo_pessoa}:\n`
        response += `      👥 ${formatNumber(row.qtd_contribuintes)} contribuintes\n`
        response += `      💰 Total: ${formatCurrency(row.vl_total)} | Média: ${formatCurrency(row.vl_medio)}\n`
        response += `      ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado)} (${row.perc_arrecadado}%)\n`
      })

      return response
    }
  },

  status_refis: {
    id: 'status_refis',
    label: '📋 Status do REFIS',
    description: 'Adesões, exclusões e cancelamentos por percentual de entrada',
    query: `
      SELECT 
        percentual_entrada,
        status_refis,
        COUNT(*) AS qtd_contribuintes,
        ROUND(SUM(vl_total_negociado), 2) AS vl_total
      FROM tb_refis_analitico_2025
      GROUP BY percentual_entrada, status_refis
      ORDER BY percentual_entrada DESC, qtd_contribuintes DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado.'
      }

      let response = '📋 **Status do REFIS por Percentual**\n\n'
      
      let currentPercentual: number | null = null
      
      rows.forEach(row => {
        if (currentPercentual !== row.percentual_entrada) {
          if (currentPercentual !== null) response += '\n'
          response += `**${row.percentual_entrada}% de Entrada:**\n`
          currentPercentual = row.percentual_entrada
        }

        response += `   • ${row.status_refis}: ${formatNumber(row.qtd_contribuintes)} (${formatCurrency(row.vl_total)})\n`
      })

      return response
    }
  }
}

export function getRefisPercentualMenu(): string {
  const options = Object.values(REFIS_PERCENTUAL_OPTIONS)
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']
  
  let menu = '📊 **REFIS - Análise de Percentual de Entrada 2025**\n\n'
  menu += 'Escolha uma análise:\n\n'
  
  options.forEach((option, index) => {
    menu += `${emojis[index]} ${option.label}\n`
    menu += `   ${option.description}\n\n`
  })
  
  menu += '0️⃣ Voltar ao menu principal\n\n'
  menu += 'Digite o número da opção desejada:'
  
  return menu
}

export async function executeRefisPercentualQuery(optionId: string, pool: Pool): Promise<string> {
  const option = REFIS_PERCENTUAL_OPTIONS[optionId]
  
  if (!option) {
    return '❌ Opção inválida.'
  }

  try {
    const result = await pool.query(option.query)
    return option.formatResponse(result.rows)
  } catch (error: any) {
    console.error('Erro ao executar query REFIS Percentual:', error)
    return `❌ Erro ao executar consulta: ${error.message}`
  }
}

// Funções auxiliares de formatação
function formatCurrency(value: any): string {
  const num = Number(value)
  if (isNaN(num)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

function formatNumber(value: any): string {
  const num = Number(value)
  if (isNaN(num)) return '0'
  return new Intl.NumberFormat('pt-BR').format(num)
}

function formatDate(value: any): string {
  if (!value) return 'N/I'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'N/I'
  return date.toLocaleDateString('pt-BR')
}
