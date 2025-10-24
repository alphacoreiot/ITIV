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

COMPORTAMENTO IMPORTANTE:
1. Quando receber uma pergunta SEM dados de consulta (queryResult vazio):
   - Responda APENAS com JSON no formato: {"needsQuery": true, "sqlQuery": "SELECT..."}
   - NÃO adicione texto antes ou depois do JSON
   - NÃO explique o que vai fazer
   
2. Quando receber dados da consulta (queryResult preenchido):
   - Formate resposta executiva com os dados reais
   - Use o formato: 📊 [Números] 📈 [Análise] 🎯 [Recomendação]

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
    console.log('📨 Recebendo requisição chatbot...')
    
    const { messages } = await request.json()

    console.log('📝 Mensagens recebidas:', messages?.length || 0)

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key não configurada')
      return NextResponse.json(
        { error: 'OpenAI API key não configurada' },
        { status: 500 }
      )
    }

    // ETAPA 1: Gerar SQL
    console.log('🔍 Etapa 1: Gerando SQL...')
    
    const sqlPrompt = SYSTEM_PROMPT + `\n\n=== INSTRUÇÃO CRÍTICA ===
Você DEVE responder APENAS com um objeto JSON válido.
Nada mais, nada menos. ZERO texto adicional.

Formato EXATO:
{"needsQuery": true, "sqlQuery": "SELECT ..."}

NÃO escreva explicações. APENAS o JSON puro. Comece com { e termine com }`

    const sqlCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sqlPrompt },
        ...messages,
      ],
      temperature: 0.0,
      max_tokens: 300,
    })

    const sqlResponse = sqlCompletion.choices[0].message.content || ''
    console.log('📄 Resposta SQL:', sqlResponse.substring(0, 100))

    // Extrair SQL
    const jsonMatch = sqlResponse.match(/\{[\s\S]*?"needsQuery"[\s\S]*?"sqlQuery"[\s\S]*?\}/)
    
    if (!jsonMatch) {
      console.error('❌ Não foi possível extrair SQL da resposta')
      return NextResponse.json(
        { error: 'Não foi possível gerar consulta SQL' },
        { status: 500 }
      )
    }

    const { sqlQuery } = JSON.parse(jsonMatch[0])
    console.log('✅ SQL extraído:', sqlQuery.substring(0, 100) + '...')

    // ETAPA 2: Executar SQL
    console.log('🔍 Etapa 2: Executando consulta...')
    
    const { Pool } = await import('pg')
    const pool = new Pool({
      host: '10.0.20.61',
      port: 5432,
      database: 'metabase',
      user: 'postgres',
      password: 'CEnIg8shcyeF',
    })

    const queryResult = await pool.query(sqlQuery)
    await pool.end()
    
    console.log('✅ Consulta executada:', queryResult.rows.length, 'linhas')

    // ETAPA 3: Formatar resposta
    console.log('� Etapa 3: Formatando resposta...')
    
    const formatPrompt = SYSTEM_PROMPT + `\n\n=== DADOS DA CONSULTA ===
${JSON.stringify(queryResult.rows, null, 2)}

Formate uma resposta EXECUTIVA em linguagem natural.
Use o formato:
📊 [Números principais]
📈 [Análise técnica]
🎯 [Recomendação se aplicável]

NÃO mencione SQL, tabelas ou termos técnicos.
Responda como um especialista conversando com um gestor.`

    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: formatPrompt },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 800,
    })

    const finalResponse = finalCompletion.choices[0].message
    console.log('✅ Resposta formatada com sucesso')

    return NextResponse.json({ message: finalResponse })

  } catch (error: any) {
    console.error('❌ Erro no chatbot:', error)
    console.error('📋 Stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar mensagem',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    )
  }
}
