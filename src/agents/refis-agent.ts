import { Pool } from 'pg'

export interface REFISOption {
  id: string
  label: string
  description: string
  query: string
  formatResponse: (rows: any[]) => string
}

export const REFIS_OPTIONS: Record<string, REFISOption> = {
  resumo_geral: {
    id: 'resumo_geral',
    label: '📊 Resumo Geral REFIS 2025',
    description: 'Panorama completo: adesões, valores, status dos acordos',
    query: `
      SELECT
        COUNT(*)::int AS total_registros,
        COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_total,
        COALESCE(SUM(vl_lancamento_indice::numeric), 0)::numeric AS valor_arrecadado,
        COALESCE(SUM(vl_total_refis::numeric) - SUM(vl_lancamento_indice::numeric), 0)::numeric AS valor_em_aberto,
        COALESCE(SUM(qtd_parcelas_total), 0)::int AS parcelas_totais,
        COALESCE(SUM(qtd_parcelas_pagas), 0)::int AS parcelas_pagas,
        COALESCE(SUM(qtd_parcelas_abertas), 0)::int AS parcelas_abertas,
        SUM(CASE WHEN status_refis = 'ATIVO' THEN 1 ELSE 0 END)::int AS acordos_ativos,
        SUM(CASE WHEN status_refis IN ('CANCELADO', 'EXCLUÍDO') THEN 1 ELSE 0 END)::int AS acordos_em_risco,
        MAX(dtlancamento) AS ultima_adesao,
        MIN(dtlancamento) AS primeira_adesao
      FROM tb_refis_2025
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado encontrado para REFIS 2025.'
      }

      const data = rows[0]
      const taxaArrecadacao = (Number(data.valor_arrecadado) / Number(data.valor_total)) * 100
      const taxaPagamento = (Number(data.parcelas_pagas) / Number(data.parcelas_totais)) * 100

      return `📊 **REFIS 2025 - Resumo Executivo**

💼 **Adesões:**
• Total de acordos: ${formatNumber(data.total_registros)}
• Acordos ativos: ${formatNumber(data.acordos_ativos)}
• Em risco: ${formatNumber(data.acordos_em_risco)}

💰 **Valores:**
• Negociado: ${formatCurrency(data.valor_total)}
• Arrecadado: ${formatCurrency(data.valor_arrecadado)}
• Em aberto: ${formatCurrency(data.valor_em_aberto)}
• Taxa de arrecadação: ${taxaArrecadacao.toFixed(2)}%

📑 **Parcelamento:**
• Total de parcelas: ${formatNumber(data.parcelas_totais)}
• Pagas: ${formatNumber(data.parcelas_pagas)} (${taxaPagamento.toFixed(1)}%)
• Abertas: ${formatNumber(data.parcelas_abertas)}

📅 **Período:** ${formatDate(data.primeira_adesao)} a ${formatDate(data.ultima_adesao)}`
    }
  },

  situacao_acordos: {
    id: 'situacao_acordos',
    label: '📋 Situação dos Acordos',
    description: 'Distribuição dos acordos por status (ATIVO, QUITADO, CANCELADO, etc.)',
    query: `
      SELECT
        CASE
          WHEN status_refis = 'ATIVO' THEN 'ADESÃO'
          WHEN status_refis = 'EXCLUÍDO' THEN 'EXCLUSÃO'
          WHEN status_refis = 'QUITADO' THEN 'HOMOLOGADOS'
          ELSE INITCAP(status_refis)
        END AS status_label,
        COUNT(*)::int AS quantidade,
        COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado
      FROM tb_refis_2025
      GROUP BY status_label
      ORDER BY quantidade DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado de situação encontrado.'
      }

      let response = '📋 **REFIS 2025 - Situação dos Acordos**\n\n'
      let totalAcordos = 0
      let totalValor = 0

      rows.forEach((row) => {
        totalAcordos += Number(row.quantidade)
        totalValor += Number(row.valor_negociado)
        
        const percentual = 0 // Calculado depois
        response += `**${row.status_label}**\n`
        response += `   📊 Quantidade: ${formatNumber(row.quantidade)}\n`
        response += `   💰 Valor: ${formatCurrency(row.valor_negociado)}\n\n`
      })

      response += `**TOTAL GERAL:**\n`
      response += `• Acordos: ${formatNumber(totalAcordos)}\n`
      response += `• Valor: ${formatCurrency(totalValor)}`

      return response
    }
  },

  distribuicao_parcelas: {
    id: 'distribuicao_parcelas',
    label: '📊 Distribuição de Parcelas',
    description: 'Análise por faixa de parcelamento (à vista, até 12x, até 24x, etc.)',
    query: `
      SELECT
        CASE
          WHEN qtd_parcelas_total = 1 THEN 'A vista'
          WHEN qtd_parcelas_total BETWEEN 2 AND 12 THEN 'Até 12x'
          WHEN qtd_parcelas_total BETWEEN 13 AND 18 THEN 'Até 18x'
          WHEN qtd_parcelas_total BETWEEN 19 AND 24 THEN 'Até 24x'
          ELSE 'Acima de 24x'
        END AS faixa,
        COUNT(*)::int AS quantidade,
        COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado
      FROM tb_refis_2025
      GROUP BY faixa
      ORDER BY 
        CASE faixa
          WHEN 'A vista' THEN 1
          WHEN 'Até 12x' THEN 2
          WHEN 'Até 18x' THEN 3
          WHEN 'Até 24x' THEN 4
          ELSE 5
        END
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado de parcelamento encontrado.'
      }

      let response = '📊 **REFIS 2025 - Distribuição por Parcelas**\n\n'
      let totalQuantidade = 0
      let totalValor = 0

      rows.forEach((row) => {
        totalQuantidade += Number(row.quantidade)
        totalValor += Number(row.valor_negociado)
      })

      rows.forEach((row) => {
        const percentQuantidade = (Number(row.quantidade) / totalQuantidade) * 100
        const percentValor = (Number(row.valor_negociado) / totalValor) * 100
        
        response += `**${row.faixa}**\n`
        response += `   📊 ${formatNumber(row.quantidade)} acordos (${percentQuantidade.toFixed(1)}%)\n`
        response += `   💰 ${formatCurrency(row.valor_negociado)} (${percentValor.toFixed(1)}%)\n\n`
      })

      return response
    }
  },

  top_contribuintes: {
    id: 'top_contribuintes',
    label: '🏆 Top 10 Contribuintes',
    description: 'Maiores valores negociados no REFIS 2025',
    query: `
      SELECT
        COALESCE(TRIM(contribuinte), 'Não informado') AS contribuinte,
        COALESCE(TRIM(cpf_cnpj), '-') AS cpf_cnpj,
        tipo_pessoa,
        COUNT(*)::int AS agreements,
        COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado,
        COALESCE(SUM(vl_lancamento_indice::numeric), 0)::numeric AS valor_arrecadado,
        SUM(qtd_parcelas_total) AS total_parcelas,
        SUM(qtd_parcelas_pagas) AS parcelas_pagas
      FROM tb_refis_2025
      GROUP BY contribuinte, cpf_cnpj, tipo_pessoa
      ORDER BY valor_negociado DESC
      LIMIT 10
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum contribuinte encontrado.'
      }

      let response = '🏆 **Top 10 Contribuintes REFIS 2025**\n\n'
      let totalNegociado = 0

      rows.forEach((row, index) => {
        totalNegociado += Number(row.valor_negociado)
        const taxaQuitacao = (Number(row.parcelas_pagas) / Number(row.total_parcelas)) * 100
        
        response += `**${index + 1}. ${row.contribuinte}**\n`
        response += `   👤 ${row.tipo_pessoa} - ${row.cpf_cnpj}\n`
        response += `   📑 ${row.agreements} acordo(s)\n`
        response += `   💰 Negociado: ${formatCurrency(row.valor_negociado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.valor_arrecadado)}\n`
        response += `   📊 Quitação: ${taxaQuitacao.toFixed(1)}%\n\n`
      })

      response += `💼 **Total (Top 10)**: ${formatCurrency(totalNegociado)}`

      return response
    }
  },

  status_financeiro: {
    id: 'status_financeiro',
    label: '💰 Status Financeiro',
    description: 'Análise financeira detalhada: em dia, quitados, cancelados',
    query: `
      SELECT
        CASE
          WHEN status_refis = 'ATIVO' THEN 'Em dia'
          WHEN status_refis = 'QUITADO' THEN 'Quitado'
          WHEN status_refis = 'CANCELADO' THEN 'Cancelado'
          WHEN status_refis = 'EXCLUÍDO' THEN 'Excluído'
          ELSE INITCAP(status_refis)
        END AS situacao,
        COUNT(*)::int AS quantidade,
        COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado,
        COALESCE(SUM(vl_lancamento_indice::numeric), 0)::numeric AS valor_arrecadado
      FROM tb_refis_2025
      GROUP BY situacao
      ORDER BY quantidade DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado financeiro encontrado.'
      }

      let response = '💰 **REFIS 2025 - Status Financeiro**\n\n'
      let totalQuantidade = 0
      let totalNegociado = 0
      let totalArrecadado = 0

      rows.forEach((row) => {
        totalQuantidade += Number(row.quantidade)
        totalNegociado += Number(row.valor_negociado)
        totalArrecadado += Number(row.valor_arrecadado)
        
        const taxaArrecadacao = (Number(row.valor_arrecadado) / Number(row.valor_negociado)) * 100
        
        response += `**${row.situacao}**\n`
        response += `   📊 ${formatNumber(row.quantidade)} acordo(s)\n`
        response += `   💰 Negociado: ${formatCurrency(row.valor_negociado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.valor_arrecadado)}\n`
        response += `   📈 Taxa: ${taxaArrecadacao.toFixed(2)}%\n\n`
      })

      const taxaGeralArrecadacao = (totalArrecadado / totalNegociado) * 100

      response += `**CONSOLIDADO:**\n`
      response += `• Total acordos: ${formatNumber(totalQuantidade)}\n`
      response += `• Negociado: ${formatCurrency(totalNegociado)}\n`
      response += `• Arrecadado: ${formatCurrency(totalArrecadado)}\n`
      response += `• Taxa geral: ${taxaGeralArrecadacao.toFixed(2)}%`

      return response
    }
  },

  por_tipo_pessoa: {
    id: 'por_tipo_pessoa',
    label: '👥 Pessoa Física vs Jurídica',
    description: 'Comparativo entre PF e PJ no REFIS 2025',
    query: `
      SELECT
        tipo_pessoa,
        COUNT(*)::int AS quantidade,
        COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado,
        COALESCE(SUM(vl_lancamento_indice::numeric), 0)::numeric AS valor_arrecadado,
        COALESCE(AVG(vl_total_refis::numeric), 0)::numeric AS valor_medio
      FROM tb_refis_2025
      WHERE tipo_pessoa IS NOT NULL
      GROUP BY tipo_pessoa
      ORDER BY valor_negociado DESC
    `,
    formatResponse: (rows) => {
      if (!rows || rows.length === 0) {
        return '❌ Nenhum dado de tipo de pessoa encontrado.'
      }

      let response = '👥 **REFIS 2025 - Pessoa Física vs Jurídica**\n\n'

      rows.forEach((row) => {
        const taxaArrecadacao = (Number(row.valor_arrecadado) / Number(row.valor_negociado)) * 100
        
        response += `**${row.tipo_pessoa}**\n`
        response += `   📊 Quantidade: ${formatNumber(row.quantidade)}\n`
        response += `   💰 Negociado: ${formatCurrency(row.valor_negociado)}\n`
        response += `   ✅ Arrecadado: ${formatCurrency(row.valor_arrecadado)}\n`
        response += `   📈 Valor médio: ${formatCurrency(row.valor_medio)}\n`
        response += `   🎯 Taxa: ${taxaArrecadacao.toFixed(2)}%\n\n`
      })

      return response
    }
  }
}

export async function executeREFISQuery(optionId: string, pool: Pool): Promise<string> {
  const option = REFIS_OPTIONS[optionId]
  
  if (!option) {
    throw new Error(`Opção REFIS inválida: ${optionId}`)
  }

  try {
    const result = await pool.query(option.query)
    return option.formatResponse(result.rows)
  } catch (error: any) {
    console.error(`Erro ao executar consulta REFIS ${optionId}:`, error)
    throw new Error(`Erro ao consultar dados de REFIS: ${error.message}`)
  }
}

export function getREFISMenu(): string {
  return `💼 **Especialista em REFIS - Escolha uma opção:**

${Object.values(REFIS_OPTIONS).map((opt, index) => 
  `${index + 1}. ${opt.label}\n   ${opt.description}`
).join('\n\n')}

Digite o número da opção desejada ou "voltar" para o menu principal.`
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

function formatDate(value: any): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('pt-BR')
}
