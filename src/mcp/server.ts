import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import { z } from 'zod';

// Configuração do banco de dados
const pool = new Pool({
  host: '10.0.20.61',
  port: 5432,
  database: 'metabase',
  user: 'postgres',
  password: 'CEnIg8shcyeF',
});

// Schemas de validação
const ConsultaTFFSchema = z.object({
  tipo_consulta: z.enum([
    'resumo_geral',
    'por_tipo_pessoa',
    'por_segmento',
    'maiores_contribuintes',
    'inadimplentes'
  ]),
  ano: z.enum(['2024', '2025', 'comparativo']).optional().default('2025'),
  limite: z.number().optional().default(30),
});

const ConsultaIPTUSchema = z.object({
  tipo_consulta: z.enum([
    'resumo_geral',
    'por_bairro',
    'cota_unica_vs_parcelado',
    'historico_5_anos',
    'maiores_pagadores',
    'maiores_devedores'
  ]),
  ano: z.enum(['2020', '2021', '2022', '2023', '2024', '2025']).optional().default('2025'),
  limite: z.number().optional().default(10),
});

// Servidor MCP
const server = new Server(
  {
    name: 'tributario-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool 1: Consultar TFF
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'consultar_tff',
        description: `Consulta dados da Taxa de Fiscalização de Funcionamento (TFF).
        
Tipos de consulta disponíveis:
- resumo_geral: Valores totais lançados, arrecadados e inadimplentes
- por_tipo_pessoa: Comparativo entre Pessoa Física e Pessoa Jurídica
- por_segmento: Análise por segmento econômico (Indústria, Comércio, Serviços)
- maiores_contribuintes: Top N maiores contribuintes
- inadimplentes: Contribuintes com pagamento pendente

Anos disponíveis: 2024, 2025, comparativo (2024 x 2025)`,
        inputSchema: {
          type: 'object',
          properties: {
            tipo_consulta: {
              type: 'string',
              enum: ['resumo_geral', 'por_tipo_pessoa', 'por_segmento', 'maiores_contribuintes', 'inadimplentes'],
              description: 'Tipo de análise desejada',
            },
            ano: {
              type: 'string',
              enum: ['2024', '2025', 'comparativo'],
              description: 'Ano de referência (padrão: 2025)',
            },
            limite: {
              type: 'number',
              description: 'Limite de registros para top N (padrão: 30)',
            },
          },
          required: ['tipo_consulta'],
        },
      },
      {
        name: 'consultar_iptu',
        description: `Consulta dados do Imposto Predial e Territorial Urbano (IPTU).
        
Tipos de consulta disponíveis:
- resumo_geral: Total arrecadado, quantidade de contribuintes, taxas
- por_bairro: Arrecadação por região geográfica
- cota_unica_vs_parcelado: Comparativo das formas de pagamento
- historico_5_anos: Evolução de 2020 a 2025
- maiores_pagadores: Top N pagadores (cota única e parcelado)
- maiores_devedores: Top N devedores

Anos disponíveis: 2020, 2021, 2022, 2023, 2024, 2025`,
        inputSchema: {
          type: 'object',
          properties: {
            tipo_consulta: {
              type: 'string',
              enum: ['resumo_geral', 'por_bairro', 'cota_unica_vs_parcelado', 'historico_5_anos', 'maiores_pagadores', 'maiores_devedores'],
              description: 'Tipo de análise desejada',
            },
            ano: {
              type: 'string',
              enum: ['2020', '2021', '2022', '2023', '2024', '2025'],
              description: 'Ano de referência (padrão: 2025)',
            },
            limite: {
              type: 'number',
              description: 'Limite de registros para top N (padrão: 10)',
            },
          },
          required: ['tipo_consulta'],
        },
      },
      {
        name: 'consulta_sql_customizada',
        description: `Executa consulta SQL customizada nas tabelas do banco de dados tributário.
        
IMPORTANTE: Use esta ferramenta APENAS quando as ferramentas especializadas (consultar_tff, consultar_iptu) não atenderem a necessidade.

Tabelas disponíveis:
- tb_tff_2025: Dados TFF completos
- tb_arrec_iptu_2025: Arrecadação IPTU detalhada
- tb_lanc_arrec_iptu_2025: Lançado vs Arrecadado
- tb_arrec_iptu_5_anos: Histórico 2020-2025
- tb_cota_unica_iptu_2025: Top 100 cota única
- tb_parcelados_iptu_2025: Top 100 parcelados
- tb_maiores_devedores_iptu_2025: Top devedores

REGRAS DE SEGURANÇA:
- Apenas comandos SELECT são permitidos
- Não usar DROP, DELETE, UPDATE, INSERT
- Limite máximo de 1000 registros`,
        inputSchema: {
          type: 'object',
          properties: {
            sql_query: {
              type: 'string',
              description: 'Consulta SQL válida (apenas SELECT)',
            },
            descricao: {
              type: 'string',
              description: 'Descrição do que a consulta faz (para logs)',
            },
          },
          required: ['sql_query'],
        },
      },
    ],
  };
});

// Handler para executar tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'consultar_tff': {
        const params = ConsultaTFFSchema.parse(args);
        const resultado = await executarConsultaTFF(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(resultado, null, 2),
            },
          ],
        };
      }

      case 'consultar_iptu': {
        const params = ConsultaIPTUSchema.parse(args);
        const resultado = await executarConsultaIPTU(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(resultado, null, 2),
            },
          ],
        };
      }

      case 'consulta_sql_customizada': {
        const { sql_query, descricao } = args as { sql_query: string; descricao?: string };
        
        // Validação de segurança
        const sqlUpper = sql_query.trim().toUpperCase();
        if (!sqlUpper.startsWith('SELECT')) {
          throw new Error('Apenas comandos SELECT são permitidos');
        }
        if (/(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)/i.test(sql_query)) {
          throw new Error('Comandos de modificação não são permitidos');
        }

        console.log(`[MCP] Executando SQL customizado: ${descricao || 'N/A'}`);
        const resultado = await pool.query(sql_query);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                sucesso: true,
                descricao,
                total_registros: resultado.rows.length,
                dados: resultado.rows.slice(0, 1000), // Limite de segurança
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Tool não reconhecida: ${name}`);
    }
  } catch (error: any) {
    console.error(`[MCP] Erro ao executar ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            erro: true,
            mensagem: error.message,
            detalhes: error.stack,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Funções de consulta TFF
async function executarConsultaTFF(params: z.infer<typeof ConsultaTFFSchema>) {
  const { tipo_consulta, ano, limite } = params;

  switch (tipo_consulta) {
    case 'resumo_geral': {
      if (ano === 'comparativo') {
        const query = `
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
          WHERE vl_lancamento_tff_atual IS NOT NULL;
        `;
        const result = await pool.query(query);
        return { tipo_consulta, ano, dados: result.rows };
      } else {
        const campo_ano = ano === '2024' ? 'anterior' : 'atual';
        const query = `
          SELECT 
            COUNT(DISTINCT inscricao_municipal) AS qtd_contribuintes,
            ROUND(COALESCE(SUM(vl_lancamento_tff_${campo_ano}), 0)::numeric, 2) AS vl_lancado,
            ROUND(COALESCE(SUM(vl_pago_tff_${campo_ano}), 0)::numeric, 2) AS vl_arrecadado,
            ROUND(COALESCE(SUM(vl_isento_lancamento_tff_${campo_ano}), 0)::numeric, 2) AS vl_isento,
            ROUND(COALESCE(SUM(vl_lancamento_tff_${campo_ano}) - SUM(vl_pago_tff_${campo_ano}), 0)::numeric, 2) AS vl_saldo_devedor,
            ROUND((COALESCE(SUM(vl_pago_tff_${campo_ano}), 0) / NULLIF(SUM(vl_lancamento_tff_${campo_ano}), 0)) * 100, 2) AS perc_arrecadacao
          FROM tb_tff_2025
          WHERE vl_lancamento_tff_${campo_ano} > 0;
        `;
        const result = await pool.query(query);
        return { tipo_consulta, ano, dados: result.rows };
      }
    }

    case 'por_tipo_pessoa': {
      const query = `
        SELECT 
          CASE 
            WHEN tipo_pessoa LIKE '%F%' OR tipo_pessoa LIKE '%Física%' THEN 'Pessoa Física (PF)'
            WHEN tipo_pessoa LIKE '%J%' OR tipo_pessoa LIKE '%Jurídica%' THEN 'Pessoa Jurídica (PJ)'
            ELSE tipo_pessoa
          END AS tipo_pessoa,
          
          COUNT(DISTINCT CASE WHEN vl_lancamento_tff_anterior > 0 THEN inscricao_municipal END) AS qtd_contribuintes_2024,
          ROUND(COALESCE(SUM(vl_lancamento_tff_anterior), 0)::numeric, 2) AS vl_lancado_2024,
          ROUND(COALESCE(SUM(vl_pago_tff_anterior), 0)::numeric, 2) AS vl_arrecadado_2024,
          
          COUNT(DISTINCT CASE WHEN vl_lancamento_tff_atual > 0 THEN inscricao_municipal END) AS qtd_contribuintes_2025,
          ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) AS vl_lancado_2025,
          ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_arrecadado_2025
        
        FROM tb_tff_2025
        WHERE tipo_pessoa IS NOT NULL AND TRIM(tipo_pessoa) <> ''
        GROUP BY 
          CASE 
            WHEN tipo_pessoa LIKE '%F%' OR tipo_pessoa LIKE '%Física%' THEN 'Pessoa Física (PF)'
            WHEN tipo_pessoa LIKE '%J%' OR tipo_pessoa LIKE '%Jurídica%' THEN 'Pessoa Jurídica (PJ)'
            ELSE tipo_pessoa
          END;
      `;
      const result = await pool.query(query);
      return { tipo_consulta, dados: result.rows };
    }

    case 'por_segmento': {
      const query = `
        SELECT 
          segmento,
          COUNT(DISTINCT CASE WHEN vl_lancamento_tff_anterior > 0 THEN inscricao_municipal END) AS qtd_contribuintes_2024,
          ROUND(COALESCE(SUM(vl_lancamento_tff_anterior), 0)::numeric, 2) AS vl_lancado_2024,
          ROUND(COALESCE(SUM(vl_pago_tff_anterior), 0)::numeric, 2) AS vl_arrecadado_2024,
          
          COUNT(DISTINCT CASE WHEN vl_lancamento_tff_atual > 0 THEN inscricao_municipal END) AS qtd_contribuintes_2025,
          ROUND(COALESCE(SUM(vl_lancamento_tff_atual), 0)::numeric, 2) AS vl_lancado_2025,
          ROUND(COALESCE(SUM(vl_pago_tff_atual), 0)::numeric, 2) AS vl_arrecadado_2025
        
        FROM tb_tff_2025
        WHERE segmento IS NOT NULL AND TRIM(segmento) <> ''
        GROUP BY segmento
        ORDER BY vl_lancado_2025 DESC;
      `;
      const result = await pool.query(query);
      return { tipo_consulta, dados: result.rows };
    }

    case 'maiores_contribuintes': {
      const campo_ano = ano === '2024' ? 'anterior' : 'atual';
      const query = `
        SELECT 
          inscricao_municipal,
          contribuinte,
          cpf_cnpj,
          tipo_pessoa,
          segmento,
          ROUND(COALESCE(vl_lancamento_tff_${campo_ano}, 0)::numeric, 2) AS vl_lancado,
          ROUND(COALESCE(vl_pago_tff_${campo_ano}, 0)::numeric, 2) AS vl_arrecadado,
          ROUND((COALESCE(vl_lancamento_tff_${campo_ano}, 0) - COALESCE(vl_pago_tff_${campo_ano}, 0))::numeric, 2) AS vl_saldo_devedor
        FROM tb_tff_2025
        WHERE vl_lancamento_tff_${campo_ano} > 0
        ORDER BY vl_lancamento_tff_${campo_ano} DESC
        LIMIT $1;
      `;
      const result = await pool.query(query, [limite]);
      return { tipo_consulta, ano, limite, dados: result.rows };
    }

    case 'inadimplentes': {
      const campo_ano = ano === '2024' ? 'anterior' : 'atual';
      const query = `
        SELECT 
          inscricao_municipal,
          contribuinte,
          cpf_cnpj,
          tipo_pessoa,
          segmento,
          ROUND(COALESCE(vl_lancamento_tff_${campo_ano}, 0)::numeric, 2) AS vl_lancado,
          ROUND(COALESCE(vl_pago_tff_${campo_ano}, 0)::numeric, 2) AS vl_arrecadado,
          ROUND((COALESCE(vl_lancamento_tff_${campo_ano}, 0) - COALESCE(vl_pago_tff_${campo_ano}, 0))::numeric, 2) AS vl_saldo_devedor
        FROM tb_tff_2025
        WHERE vl_lancamento_tff_${campo_ano} > 0 
          AND (vl_lancamento_tff_${campo_ano} - COALESCE(vl_pago_tff_${campo_ano}, 0)) > 0
        ORDER BY (vl_lancamento_tff_${campo_ano} - COALESCE(vl_pago_tff_${campo_ano}, 0)) DESC
        LIMIT $1;
      `;
      const result = await pool.query(query, [limite]);
      return { tipo_consulta, ano, limite, dados: result.rows };
    }

    default:
      throw new Error(`Tipo de consulta TFF não reconhecido: ${tipo_consulta}`);
  }
}

// Funções de consulta IPTU
async function executarConsultaIPTU(params: z.infer<typeof ConsultaIPTUSchema>) {
  const { tipo_consulta, ano, limite } = params;

  switch (tipo_consulta) {
    case 'resumo_geral': {
      const query = `
        SELECT 
          ano_base,
          tributo,
          vl_lancado,
          qtdd_contribuintes,
          vl_pago,
          cota_unica,
          ROUND((vl_pago / NULLIF(vl_lancado, 0)) * 100, 2) AS perc_arrecadacao,
          ROUND(vl_lancado - vl_pago, 2) AS saldo_devedor
        FROM tb_lanc_arrec_iptu_2025
        WHERE ano_base = $1
        ORDER BY tributo, cota_unica;
      `;
      const result = await pool.query(query, [parseInt(ano)]);
      return { tipo_consulta, ano, dados: result.rows };
    }

    case 'por_bairro': {
      const query = `
        SELECT 
          bairro,
          COUNT(DISTINCT inscricao_municipal) AS qtd_contribuintes,
          ROUND(SUM(vl_arrecadado)::numeric, 2) AS total_arrecadado,
          ROUND(AVG(vl_arrecadado)::numeric, 2) AS media_por_contribuinte
        FROM tb_arrec_iptu_2025
        WHERE tributo = 'IPTU' AND ano_base = $1
        GROUP BY bairro
        ORDER BY total_arrecadado DESC
        LIMIT $2;
      `;
      const result = await pool.query(query, [parseInt(ano), limite]);
      return { tipo_consulta, ano, limite, dados: result.rows };
    }

    case 'cota_unica_vs_parcelado': {
      const query = `
        SELECT 
          tributo,
          cota_unica,
          vl_lancado,
          vl_pago,
          qtdd_contribuintes,
          ROUND((vl_pago / NULLIF(vl_lancado, 0)) * 100, 2) AS perc_arrecadacao
        FROM tb_lanc_arrec_iptu_2025
        WHERE ano_base = $1
        ORDER BY tributo, cota_unica DESC;
      `;
      const result = await pool.query(query, [parseInt(ano)]);
      return { tipo_consulta, ano, dados: result.rows };
    }

    case 'historico_5_anos': {
      const query = `
        SELECT 
          ano_base,
          tributo,
          COUNT(DISTINCT inscricao_municipal) AS qtd_contribuintes,
          ROUND(SUM(vl_arrecadado)::numeric, 2) AS vl_total_arrecadado
        FROM tb_arrec_iptu_5_anos
        WHERE tributo IS NOT NULL
        GROUP BY ano_base, tributo
        ORDER BY ano_base, tributo;
      `;
      const result = await pool.query(query);
      return { tipo_consulta, dados: result.rows };
    }

    case 'maiores_pagadores': {
      const query = `
        SELECT 
          'COTA ÚNICA' AS modalidade,
          codigo_entidade,
          nome_razao_responsavel_tributario AS contribuinte,
          documento_responsavel_tributario AS documento,
          ROUND(vl_lan_2025::numeric, 2) AS vl_lancado,
          ROUND(vl_total_arrecadado_pgto_cota_unica_2025::numeric, 2) AS vl_pago
        FROM tb_cota_unica_iptu_2025
        ORDER BY vl_total_arrecadado_pgto_cota_unica_2025 DESC
        LIMIT $1
        
        UNION ALL
        
        SELECT 
          'PARCELADO' AS modalidade,
          codigo_entidade,
          nome_razao_responsavel_tributario AS contribuinte,
          documento_responsavel_tributario AS documento,
          ROUND(vl_lan_2025::numeric, 2) AS vl_lancado,
          ROUND(vl_total_arrecadado_pgto_parcelado_2025::numeric, 2) AS vl_pago
        FROM tb_parcelados_iptu_2025
        ORDER BY vl_total_arrecadado_pgto_parcelado_2025 DESC
        LIMIT $1;
      `;
      const result = await pool.query(query, [limite]);
      return { tipo_consulta, limite, dados: result.rows };
    }

    case 'maiores_devedores': {
      const query = `
        SELECT 
          inscricao,
          contribuinte,
          COUNT(*) AS qtd_lancamentos,
          ROUND(SUM(vl_original)::numeric, 2) AS divida_total,
          string_agg(DISTINCT situacao_parcela, ', ') AS situacoes
        FROM tb_maiores_devedores_iptu_2025
        WHERE ano_base = $1
        GROUP BY inscricao, contribuinte
        ORDER BY divida_total DESC
        LIMIT $2;
      `;
      const result = await pool.query(query, [parseInt(ano), limite]);
      return { tipo_consulta, ano, limite, dados: result.rows };
    }

    default:
      throw new Error(`Tipo de consulta IPTU não reconhecido: ${tipo_consulta}`);
  }
}

// Iniciar servidor
async function main() {
  console.log('[MCP Server Tributário] Iniciando...');
  
  // Testar conexão com banco
  try {
    await pool.query('SELECT 1');
    console.log('[MCP Server Tributário] ✅ Conexão com banco de dados estabelecida');
  } catch (error) {
    console.error('[MCP Server Tributário] ❌ Erro ao conectar ao banco:', error);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log('[MCP Server Tributário] ✅ Servidor pronto para receber requisições');
}

main().catch((error) => {
  console.error('[MCP Server Tributário] Erro fatal:', error);
  process.exit(1);
});
