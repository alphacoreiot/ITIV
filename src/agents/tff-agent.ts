import { Pool } from 'pg'

export interface TFFOption {
  id: string
  label: string
  description: string
  query: string
  formatResponse: (rows: any[]) => string
}

export const TFF_OPTIONS: Record<string, TFFOption> = {
  resumo_geral: {
    id: 'resumo_geral',
    label: '📊 Resumo Geral TFF',
    description: 'Panorama completo da Taxa de Fiscalização de Funcionamento 2025',
    query: `
      SELECT 
        COUNT(DISTINCT inscricao_municipal) AS qtd_contribuintes,
        ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) AS vl_lancado,
        ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_arrecadado,
        ROUND(COALESCE(SUM(vl_isento_lancamento_tff_atual), 0)::numeric, 2) AS vl_isento,
        ROUND(COALESCE(SUM(vl_lancamento_tff_atual) - SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_saldo_devedor,
        ROUND((COALESCE(SUM(vl_pago_tff_atual), 0) / NULLIF(SUM(vl_lancamento_tff_atual), 0)) * 100, 2) AS perc_arrecadacao
      FROM tb_tff_2025
      WHERE vl_lancamento_tff_atual > 0
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado para TFF 2025.'
      }

      const data = rows[0]

      return `📊 **TFF 2025 - Resumo Executivo**

👥 **Contribuintes:** ${formatNumber(data.qtd_contribuintes)}

💰 **Valores:**
• Lançado: ${formatCurrency(data.vl_lancado)}
• Arrecadado: ${formatCurrency(data.vl_arrecadado)}
• Isento: ${formatCurrency(data.vl_isento)}
• Saldo devedor: ${formatCurrency(data.vl_saldo_devedor)}

📈 **Eficiência de Arrecadação:** ${data.perc_arrecadacao}%

${Number(data.perc_arrecadacao) >= 70 ? '✅ Excelente taxa de arrecadação!' : Number(data.perc_arrecadacao) >= 50 ? '⚠️ Taxa de arrecadação adequada, mas pode melhorar.' : '🔴 Atenção: Taxa de arrecadação abaixo do esperado.'}`
    }
  },

  comparativo_2024_2025: {
    id: 'comparativo_2024_2025',
    label: '🔄 Comparativo 2024 x 2025',
    description: 'Análise evolutiva entre 2024 e 2025',
    query: `
      SELECT 
        'ANO ANTERIOR (2024)' AS periodo,
        COUNT(DISTINCT inscricao_municipal) AS qtd_contribuintes,
        ROUND(COALESCE(SUM(vl_lancamento_tff_anterior), 0)::numeric, 2) AS vl_lancado,
        ROUND(COALESCE(SUM(vl_pago_tff_anterior), 0)::numeric, 2) AS vl_arrecadado,
        ROUND(COALESCE(SUM(vl_lancamento_tff_anterior) - SUM(vl_pago_tff_anterior), 0)::numeric, 2) AS vl_saldo_devedor,
        ROUND((COALESCE(SUM(vl_pago_tff_anterior), 0) / NULLIF(SUM(vl_lancamento_tff_anterior), 0)) * 100, 2) AS perc_arrecadacao
      FROM tb_tff_2025
      WHERE vl_lancamento_tff_anterior IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'ANO ATUAL (2025)' AS periodo,
        COUNT(DISTINCT inscricao_municipal) AS qtd_contribuintes,
        ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) AS vl_lancado,
        ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_arrecadado,
        ROUND(COALESCE(SUM(vl_lancamento_tff_atual) - SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_saldo_devedor,
        ROUND((COALESCE(SUM(vl_pago_tff_atual), 0) / NULLIF(SUM(vl_lancamento_tff_atual), 0)) * 100, 2) AS perc_arrecadacao
      FROM tb_tff_2025
      WHERE vl_lancamento_tff_atual IS NOT NULL
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length < 2) {
        return '❌ Dados insuficientes para comparação.'
      }

      const ano2024 = rows[0]
      const ano2025 = rows[1]

      const crescimentoLancado = ((Number(ano2025.vl_lancado) / Number(ano2024.vl_lancado) - 1) * 100)
      const crescimentoArrecadado = ((Number(ano2025.vl_arrecadado) / Number(ano2024.vl_arrecadado) - 1) * 100)
      const crescimentoContrib = ((Number(ano2025.qtd_contribuintes) / Number(ano2024.qtd_contribuintes) - 1) * 100)

      return `🔄 **TFF - Comparativo 2024 x 2025**

**2024:**
• 👥 Contribuintes: ${formatNumber(ano2024.qtd_contribuintes)}
• 💰 Lançado: ${formatCurrency(ano2024.vl_lancado)}
• ✅ Arrecadado: ${formatCurrency(ano2024.vl_arrecadado)}
• 📊 Taxa: ${ano2024.perc_arrecadacao}%

**2025:**
• 👥 Contribuintes: ${formatNumber(ano2025.qtd_contribuintes)}
• 💰 Lançado: ${formatCurrency(ano2025.vl_lancado)}
• ✅ Arrecadado: ${formatCurrency(ano2025.vl_arrecadado)}
• 📊 Taxa: ${ano2025.perc_arrecadacao}%

📈 **Crescimento:**
• Contribuintes: ${crescimentoContrib > 0 ? '+' : ''}${crescimentoContrib.toFixed(2)}%
• Lançado: ${crescimentoLancado > 0 ? '+' : ''}${crescimentoLancado.toFixed(2)}%
• Arrecadado: ${crescimentoArrecadado > 0 ? '+' : ''}${crescimentoArrecadado.toFixed(2)}%

${crescimentoArrecadado > 0 ? '📈 Crescimento positivo na arrecadação!' : '📉 Queda na arrecadação - necessita atenção.'}`
    }
  },

  por_tipo_pessoa: {
    id: 'por_tipo_pessoa',
    label: '👥 Pessoa Física vs Jurídica',
    description: 'Comparativo PF e PJ - lançamento e arrecadação',
    query: `
      SELECT 
        CASE 
          WHEN tipo_pessoa LIKE '%F%' OR tipo_pessoa LIKE '%Física%' THEN 'Pessoa Física (PF)'
          WHEN tipo_pessoa LIKE '%J%' OR tipo_pessoa LIKE '%Jurídica%' THEN 'Pessoa Jurídica (PJ)'
          ELSE tipo_pessoa
        END AS tipo_pessoa,
        
        COUNT(DISTINCT CASE WHEN vl_lancamento_tff_atual > 0 THEN inscricao_municipal END) AS qtd_contribuintes_2025,
        ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) AS vl_lancado_2025,
        ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_arrecadado_2025,
        ROUND((COALESCE(SUM(vl_pago_tff_atual), 0) / NULLIF(SUM(vl_lancamento_tff_atual), 0)) * 100, 2) AS taxa_arrecadacao
      
      FROM tb_tff_2025
      WHERE tipo_pessoa IS NOT NULL AND TRIM(tipo_pessoa) <> ''
      GROUP BY 
        CASE 
          WHEN tipo_pessoa LIKE '%F%' OR tipo_pessoa LIKE '%Física%' THEN 'Pessoa Física (PF)'
          WHEN tipo_pessoa LIKE '%J%' OR tipo_pessoa LIKE '%Jurídica%' THEN 'Pessoa Jurídica (PJ)'
          ELSE tipo_pessoa
        END
      ORDER BY vl_lancado_2025 DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado de tipo pessoa encontrado.'
      }

      let response = '👥 **TFF 2025 - Pessoa Física vs Jurídica**\n\n'

      rows.forEach((row) => {
        response += `**${row.tipo_pessoa}**\n`
        response += `   👤 Contribuintes: ${formatNumber(row.qtd_contribuintes_2025)}\n`
        response += `   💰 Lançado: ${formatCurrency(row.vl_lancado_2025)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado_2025)}\n`
        response += `   📊 Taxa: ${row.taxa_arrecadacao}%\n\n`
      })

      return response
    }
  },

  por_segmento: {
    id: 'por_segmento',
    label: '🏭 Análise por Segmento Econômico',
    description: 'Indústria, Comércio, Serviços e outros segmentos',
    query: `
      SELECT 
        segmento,
        COUNT(DISTINCT CASE WHEN vl_lancamento_tff_atual > 0 THEN inscricao_municipal END) AS qtd_contribuintes_2025,
        ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) AS vl_lancado_2025,
        ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_arrecadado_2025,
        ROUND((COALESCE(SUM(vl_pago_tff_atual), 0) / NULLIF(SUM(vl_lancamento_tff_atual), 0)) * 100, 2) AS taxa_arrecadacao
      
      FROM tb_tff_2025
      WHERE segmento IS NOT NULL AND TRIM(segmento) <> ''
      GROUP BY segmento
      ORDER BY vl_lancado_2025 DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado de segmento encontrado.'
      }

      let response = '🏭 **TFF 2025 - Top Segmentos Econômicos**\n\n'
      let totalLancado = 0
      let totalArrecadado = 0

      rows.forEach((row, index) => {
        totalLancado += Number(row.vl_lancado_2025)
        totalArrecadado += Number(row.vl_arrecadado_2025)
        
        response += `**${index + 1}. ${row.segmento}**\n`
        response += `   👥 ${formatNumber(row.qtd_contribuintes_2025)} contribuintes\n`
        response += `   💰 Lançado: ${formatCurrency(row.vl_lancado_2025)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado_2025)}\n`
        response += `   📊 Taxa: ${row.taxa_arrecadacao}%\n\n`
      })

      response += `**TOTAL (Top 10):**\n`
      response += `• Lançado: ${formatCurrency(totalLancado)}\n`
      response += `• Arrecadado: ${formatCurrency(totalArrecadado)}`

      return response
    }
  },

  maiores_contribuintes: {
    id: 'maiores_contribuintes',
    label: '🏆 Top 10 Maiores Contribuintes',
    description: 'Empresas/pessoas com maior lançamento TFF em 2025',
    query: `
      SELECT 
        inscricao_municipal,
        contribuinte,
        cpf_cnpj,
        tipo_pessoa,
        segmento,
        ROUND(COALESCE(vl_lancamento_tff_atual, 0)::numeric, 2) AS vl_lancado,
        ROUND(COALESCE(vl_pago_tff_atual, 0)::numeric, 2) AS vl_arrecadado,
        ROUND((COALESCE(vl_lancamento_tff_atual, 0) - COALESCE(vl_pago_tff_atual, 0))::numeric, 2) AS vl_saldo_devedor,
        ROUND((COALESCE(vl_pago_tff_atual, 0) / NULLIF(vl_lancamento_tff_atual, 0)) * 100, 2) AS taxa_pagamento
      FROM tb_tff_2025
      WHERE vl_lancamento_tff_atual > 0
      ORDER BY vl_lancamento_tff_atual DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum contribuinte encontrado.'
      }

      let response = '🏆 **Top 10 Maiores Contribuintes TFF 2025**\n\n'
      let totalLancado = 0

      rows.forEach((row, index) => {
        totalLancado += Number(row.vl_lancado)
        
        response += `**${index + 1}. ${row.contribuinte}**\n`
        response += `   📋 ${row.inscricao_municipal} | ${row.tipo_pessoa}\n`
        response += `   🏭 Segmento: ${row.segmento || 'N/A'}\n`
        response += `   💰 Lançado: ${formatCurrency(row.vl_lancado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado)}\n`
        response += `   ⚠️ Saldo: ${formatCurrency(row.vl_saldo_devedor)}\n`
        response += `   📊 Taxa: ${row.taxa_pagamento}%\n\n`
      })

      response += `💼 **Total Lançado (Top 10)**: ${formatCurrency(totalLancado)}`

      return response
    }
  },

  inadimplentes: {
    id: 'inadimplentes',
    label: '⚠️ Top 10 Inadimplentes',
    description: 'Contribuintes com maior saldo devedor em TFF 2025',
    query: `
      SELECT 
        inscricao_municipal,
        contribuinte,
        cpf_cnpj,
        tipo_pessoa,
        segmento,
        ROUND(COALESCE(vl_lancamento_tff_atual, 0)::numeric, 2) AS vl_lancado,
        ROUND(COALESCE(vl_pago_tff_atual, 0)::numeric, 2) AS vl_arrecadado,
        ROUND((COALESCE(vl_lancamento_tff_atual, 0) - COALESCE(vl_pago_tff_atual, 0))::numeric, 2) AS vl_saldo_devedor
      FROM tb_tff_2025
      WHERE vl_lancamento_tff_atual > 0 
        AND (vl_lancamento_tff_atual - COALESCE(vl_pago_tff_atual, 0)) > 0
      ORDER BY (vl_lancamento_tff_atual - COALESCE(vl_pago_tff_atual, 0)) DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '✅ Nenhum inadimplente encontrado - excelente notícia!'
      }

      let response = '⚠️ **Top 10 Inadimplentes TFF 2025**\n\n'
      let totalDivida = 0

      rows.forEach((row, index) => {
        totalDivida += Number(row.vl_saldo_devedor)
        
        response += `**${index + 1}. ${row.contribuinte}**\n`
        response += `   📋 ${row.inscricao_municipal} | ${row.tipo_pessoa}\n`
        response += `   🏭 Segmento: ${row.segmento || 'N/A'}\n`
        response += `   💰 Lançado: ${formatCurrency(row.vl_lancado)}\n`
        response += `   ✅ Pago: ${formatCurrency(row.vl_arrecadado)}\n`
        response += `   🔴 Saldo devedor: ${formatCurrency(row.vl_saldo_devedor)}\n\n`
      })

      response += `💸 **Total em Aberto (Top 10)**: ${formatCurrency(totalDivida)}\n\n`
      response += `🎯 **Recomendação**: Priorizar ações de cobrança para recuperação destes valores.`

      return response
    }
  },

  status_stm: {
    id: 'status_stm',
    label: '🏢 Status STM (Situação Cadastral)',
    description: 'Análise por status no sistema tributário municipal',
    query: `
      SELECT 
        status_stm,
        COUNT(DISTINCT inscricao_municipal) AS qtd_contribuintes,
        ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) AS vl_lancado,
        ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_arrecadado,
        ROUND((COALESCE(SUM(vl_pago_tff_atual), 0) / NULLIF(SUM(vl_lancamento_tff_atual), 0)) * 100, 2) AS taxa_arrecadacao
      FROM tb_tff_2025
      WHERE status_stm IS NOT NULL AND TRIM(status_stm) <> ''
      GROUP BY status_stm
      ORDER BY vl_lancado DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado de status STM encontrado.'
      }

      let response = '🏢 **TFF 2025 - Status STM**\n\n'

      rows.forEach((row) => {
        response += `**${row.status_stm}**\n`
        response += `   👥 ${formatNumber(row.qtd_contribuintes)} contribuintes\n`
        response += `   💰 Lançado: ${formatCurrency(row.vl_lancado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.vl_arrecadado)}\n`
        response += `   📊 Taxa: ${row.taxa_arrecadacao}%\n\n`
      })

      return response
    }
  }
}

export async function executeTFFQuery(optionId: string, pool: Pool): Promise<string> {
  const option = TFF_OPTIONS[optionId]
  
  if (!option) {
    throw new Error(`Opção TFF inválida: ${optionId}`)
  }

  try {
    const result = await pool.query(option.query)
    return option.formatResponse(result.rows)
  } catch (error: any) {
    console.error(`Erro ao executar consulta TFF ${optionId}:`, error)
    throw new Error(`Erro ao consultar dados de TFF: ${error.message}`)
  }
}

export function getTFFMenu(): string {
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣']
  
  return `🏢 **Especialista em TFF**

Escolha uma opção:

${Object.values(TFF_OPTIONS).map((opt, index) => 
  `${emojis[index]} ${opt.label}\n   ${opt.description}`
).join('\n\n')}

0️⃣ Voltar ao menu principal

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
