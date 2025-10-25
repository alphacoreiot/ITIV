import { NextResponse } from 'next/server'
import type { ResumoRefisResponse } from '@/types/dashboard'

export async function GET() {
  try {
    const { Pool } = await import('pg')

    const pool = new Pool({
      host: '10.0.20.61',
      port: 5432,
      database: 'metabase',
      user: 'postgres',
      password: 'CEnIg8shcyeF'
    })

    const client = await pool.connect()

    try {
      const resumoGeral = await client.query(`
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
      `)

      const statusResumo = await client.query(`
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
      `)

      const distribuicaoParcelas = await client.query(`
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
        ORDER BY faixa
      `)

      const statusFinanceiro = await client.query(`
        SELECT
          CASE
            WHEN status_refis = 'ATIVO' THEN 'Em dia'
            WHEN status_refis = 'QUITADO' THEN 'Quitado'
            WHEN status_refis = 'CANCELADO' THEN 'Cancelado'
            WHEN status_refis = 'EXCLUÍDO' THEN 'Excluído'
            ELSE INITCAP(status_refis)
          END AS situacao,
          COUNT(*)::int AS quantidade,
          COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado
        FROM tb_refis_2025
        GROUP BY situacao
        ORDER BY quantidade DESC
      `)

      const participacaoValores = await client.query(`
        WITH totais AS (
          SELECT COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS total
          FROM tb_refis_2025
        )
        SELECT
          CASE
            WHEN status_refis = 'ATIVO' THEN 'Ativos'
            WHEN status_refis = 'QUITADO' THEN 'Quitados'
            WHEN status_refis = 'CANCELADO' THEN 'Cancelados'
            WHEN status_refis = 'EXCLUÍDO' THEN 'Excluídos'
            ELSE INITCAP(status_refis)
          END AS categoria,
          COUNT(*)::int AS quantidade,
          COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado,
          CASE WHEN totais.total > 0 THEN ROUND((SUM(vl_total_refis::numeric) / totais.total) * 100, 2) ELSE 0 END AS percentual
        FROM tb_refis_2025, totais
        GROUP BY categoria, totais.total
        ORDER BY valor_negociado DESC
      `)

      const topContribuintes = await client.query(`
        SELECT
          COALESCE(TRIM(contribuinte), 'Não informado') AS contribuinte,
          COALESCE(TRIM(cpf_cnpj), '-') AS cpf_cnpj,
          COUNT(*)::int AS agreements,
          COALESCE(SUM(vl_total_refis::numeric), 0)::numeric AS valor_negociado
        FROM tb_refis_2025
        GROUP BY contribuinte, cpf_cnpj
        ORDER BY valor_negociado DESC
        LIMIT 5
      `)

      const resumoRow = resumoGeral.rows[0] ?? {}

      const toIsoString = (value: unknown) => {
        if (!value) return null
        if (value instanceof Date) {
          return Number.isNaN(value.getTime()) ? null : value.toISOString()
        }
        const date = new Date(value as string)
        return Number.isNaN(date.getTime()) ? null : date.toISOString()
      }

      return NextResponse.json<ResumoRefisResponse>({
        success: true,
        resumo: {
          totalRegistros: Number(resumoRow?.total_registros ?? 0),
          valorTotal: Number(resumoRow?.valor_total ?? 0),
          valorArrecadado: Number(resumoRow?.valor_arrecadado ?? 0),
          valorEmAberto: Number(resumoRow?.valor_em_aberto ?? 0),
          parcelasTotais: Number(resumoRow?.parcelas_totais ?? 0),
          parcelasPagas: Number(resumoRow?.parcelas_pagas ?? 0),
          parcelasAbertas: Number(resumoRow?.parcelas_abertas ?? 0),
          acordosAtivos: Number(resumoRow?.acordos_ativos ?? 0),
          acordosEmRisco: Number(resumoRow?.acordos_em_risco ?? 0),
          ultimaAdesao: toIsoString(resumoRow?.ultima_adesao),
          primeiraAdesao: toIsoString(resumoRow?.primeira_adesao)
        },
        statusResumo: statusResumo.rows.map(row => ({
          status: row.status_label,
          quantidade: Number(row.quantidade ?? 0),
          valorNegociado: Number(row.valor_negociado ?? 0)
        })),
        distribuicaoParcelas: distribuicaoParcelas.rows.map(row => ({
          faixa: row.faixa,
          quantidade: Number(row.quantidade ?? 0),
          valorNegociado: Number(row.valor_negociado ?? 0)
        })),
        statusFinanceiro: statusFinanceiro.rows.map(row => ({
          situacao: row.situacao,
          quantidade: Number(row.quantidade ?? 0),
          valorNegociado: Number(row.valor_negociado ?? 0)
        })),
        participacaoValores: participacaoValores.rows.map(row => ({
          categoria: row.categoria,
          quantidade: Number(row.quantidade ?? 0),
          valorNegociado: Number(row.valor_negociado ?? 0),
          percentual: Number(row.percentual ?? 0)
        })),
        topContribuintes: topContribuintes.rows.map(row => ({
          contribuinte: row.contribuinte,
          cpfCnpj: row.cpf_cnpj,
          acordos: Number(row.agreements ?? 0),
          valorNegociado: Number(row.valor_negociado ?? 0)
        }))
      })
    } finally {
      client.release()
      await pool.end()
    }
  } catch (error) {
    console.error('Erro ao obter resumo do REFIS:', error)
    return NextResponse.json({ success: false, error: 'Erro ao obter resumo do REFIS' }, { status: 500 })
  }
}
