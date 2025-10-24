import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Contexto do sistema baseado no chatbot.md
const SYSTEM_PROMPT = `Você é um ESPECIALISTA em Gestão Tributária Municipal com ACESSO DIRETO ao banco de dados.

PROCESSO EM 2 ETAPAS:

1. ANÁLISE DA PERGUNTA:
   Identifique qual informação o gestor precisa e SEMPRE gere uma consulta SQL apropriada.

2. RESPOSTA COM DADOS REAIS:
   Após receber os dados da consulta, formate a resposta de forma executiva.

TABELAS DISPONÍVEIS:
1. tb_tff_2025 - Dados TFF 2024 x 2025
2. tb_arrec_iptu_2025 - Arrecadação IPTU 2025 (detalhada com bairro)
3. tb_lanc_arrec_iptu_2025 - Lançado vs Arrecadado IPTU 2025
4. tb_arrec_iptu_5_anos - Histórico IPTU 2020-2025
5. tb_arrec_iptu_2024_2025 - Comparativo IPTU 2024 x 2025
6. tb_cota_unica_iptu_2025 - Top 100 cota única
7. tb_parcelados_iptu_2025 - Top 100 parcelados
8. tb_maiores_devedores_iptu_2025 - Top devedores

ESTRUTURA DAS TABELAS:

tb_tff_2025:
- inscricao_municipal, contribuinte, cpf_cnpj, tipo_pessoa, status_stm
- vl_lancamento_tff_anterior, vl_lancamento_tff_atual
- vl_pago_tff_anterior, vl_pago_tff_atual
- vl_isento_lancamento_tff_anterior, vl_isento_lancamento_tff_atual
- vl_receita_anterior, vl_receita_atual
- segmento, mudanca_cnae, dt_encerr_suspen
- perc_diferenca_lancamento_novo, perc_diferenca_receita, perc_diferenca_pgto

tb_arrec_iptu_2025:
- inscricao_municipal, contribuinte, ano_base, bairro, tributo
- vl_arrecadado, cota_unica, dtpgto

tb_lanc_arrec_iptu_2025:
- ano_base, tributo, vl_lancado, qtdd_contribuintes, vl_pago, cota_unica

tb_arrec_iptu_5_anos:
- inscricao_municipal, contribuinte, ano_base, tributo
- vl_arrecadado, cota_unica, dtpgto

tb_cota_unica_iptu_2025:
- codigo_entidade, nome_razao_responsavel_tributario
- documento_responsavel_tributario, vl_lan_2025
- vl_total_arrecadado_pgto_cota_unica_2025, sigla

tb_parcelados_iptu_2025:
- codigo_entidade, nome_razao_responsavel_tributario
- documento_responsavel_tributario, vl_lan_2025
- vl_total_arrecadado_pgto_parcelado_2025, sigla

tb_maiores_devedores_iptu_2025:
- inscricao, entidade, contribuinte, tipo_lancamento
- ano_base, vl_original, situacao_parcela

QUANDO RECEBER UMA PERGUNTA:
Responda com JSON contendo SQL para consultar dados reais:
{
  "needsQuery": true,
  "sqlQuery": "SELECT ... FROM ... WHERE ..."
}

APÓS RECEBER OS DADOS:
Formate resposta executiva:
📊 [Números principais]
📈 [Análise técnica]
🎯 [Recomendação]

EXEMPLOS DE SQL:

TFF Total 2025:
SELECT 
  ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) as lancado_2025,
  ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) as arrecadado_2025,
  COUNT(*) as qtd_contribuintes,
  ROUND((COALESCE(SUM(vl_pago_tff_atual), 0) / NULLIF(SUM(vl_lancamento_tff_atual), 0)) * 100, 2) as taxa_arrecadacao
FROM tb_tff_2025
WHERE vl_lancamento_tff_atual > 0;

IPTU Arrecadado 2025:
SELECT 
  tributo,
  cota_unica,
  ROUND(COALESCE(SUM(vl_arrecadado), 0)::numeric, 2) as total_arrecadado,
  COUNT(DISTINCT inscricao_municipal) as qtd_contribuintes
FROM tb_arrec_iptu_2025
WHERE ano_base = 2025
GROUP BY tributo, cota_unica
ORDER BY tributo, cota_unica;

IPTU por Bairro:
SELECT 
  bairro,
  ROUND(SUM(vl_arrecadado)::numeric, 2) as total,
  COUNT(DISTINCT inscricao_municipal) as qtd
FROM tb_arrec_iptu_2025
WHERE tributo = 'IPTU'
GROUP BY bairro
ORDER BY total DESC
LIMIT 10;

TFF por Segmento:
SELECT 
  segmento,
  COUNT(*) as qtd,
  ROUND(SUM(vl_lancamento_tff_atual)::numeric, 2) as lancado,
  ROUND(SUM(vl_pago_tff_atual)::numeric, 2) as arrecadado
FROM tb_tff_2025
WHERE vl_lancamento_tff_atual > 0
GROUP BY segmento
ORDER BY lancado DESC;

Top 10 Devedores IPTU:
SELECT 
  contribuinte,
  ROUND(SUM(vl_original)::numeric, 2) as divida_total,
  COUNT(*) as qtd_lancamentos
FROM tb_maiores_devedores_iptu_2025
GROUP BY contribuinte
ORDER BY divida_total DESC
LIMIT 10;

REGRAS:
- SEMPRE gere SQL para buscar dados reais
- Use ROUND() para valores monetários
- Use agregações (SUM, AVG, COUNT)
- Filtre dados relevantes com WHERE
- Compare períodos quando possível

Você é o especialista que CONSULTA e ANALISA dados reais.`

export async function POST(request: Request) {
  try {
    const { messages, queryResult } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada' },
        { status: 500 }
      )
    }

    // Se já temos resultado da query, incluir no contexto
    let systemPrompt = SYSTEM_PROMPT
    if (queryResult) {
      systemPrompt += `\n\nDADOS DA CONSULTA EXECUTADA:\n${JSON.stringify(queryResult, null, 2)}\n\nAgora formate a resposta baseada nestes dados REAIS.`
    }

    // Usar modelo econômico gpt-3.5-turbo com alta precisão
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.2,
      max_tokens: 600,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const response = completion.choices[0].message
    
    // Verificar se a resposta contém uma solicitação de query SQL
    let needsQuery = false
    let sqlQuery = ''
    
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.content?.match(/\{[\s\S]*"needsQuery"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.needsQuery && parsed.sqlQuery) {
          needsQuery = true
          sqlQuery = parsed.sqlQuery
        }
      }
    } catch (e) {
      // Se não for JSON, continuar normal
    }

    return NextResponse.json({ 
      message: response,
      needsQuery,
      sqlQuery
    })
  } catch (error: any) {
    console.error('❌ Erro no chatbot:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar mensagem',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
