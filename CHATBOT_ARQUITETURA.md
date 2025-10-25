# Sistema de Chatbot Tributário - Arquitetura Refatorada

## 📋 Visão Geral

O chatbot tributário foi **refatorado** para usar uma arquitetura moderna e eficiente, com comunicação em **linguagem natural** entre o usuário e os dados do sistema.

## 🏗️ Arquitetura

### Fluxo de Comunicação

```
┌─────────────┐
│   Usuário   │
│  (Frontend) │
└──────┬──────┘
       │ Pergunta em linguagem natural
       ▼
┌─────────────────────┐
│  Chatbot.tsx        │
│  - Interface React  │
│  - Estado de msgs   │
└──────┬──────────────┘
       │ POST /api/chatbot
       ▼
┌───────────────────────────┐
│  API Route                │
│  (chatbot/route.ts)       │
│                           │
│  1️⃣ Recebe pergunta        │
│  2️⃣ OpenAI gera SQL        │
│  3️⃣ Executa no PostgreSQL │
│  4️⃣ OpenAI formata resposta│
└──────┬────────────────────┘
       │ Resposta em linguagem natural
       ▼
┌─────────────┐
│   Usuário   │
│  (visualiza)│
└─────────────┘
```

## 🔧 Componentes

### 1. **Frontend** (`src/components/Chatbot.tsx`)

**Responsabilidade**: Interface de conversação

**Características**:
- ✅ Single API call (simplificado)
- ✅ Mensagens em linguagem natural
- ✅ Loading state com timeout (60s)
- ✅ Tratamento de erros amigável
- ❌ Removido: Filtragem agressiva de JSON
- ❌ Removido: Dual-call workflow

**Estado**:
```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
}
```

### 2. **API Route** (`src/app/api/chatbot/route.ts`)

**Responsabilidade**: Orquestração de IA + Banco de Dados

**Fluxo em 3 Etapas**:

#### Etapa 1: Geração de SQL
```typescript
// OpenAI gera SQL baseado na pergunta
const sqlCompletion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ],
  temperature: 0.0, // Determinístico para SQL
})
```

#### Etapa 2: Execução no Banco
```typescript
// Pool PostgreSQL executa query
const pool = new Pool({
  host: '10.0.20.61',
  database: 'metabase',
  // ...
})
const queryResult = await pool.query(sqlQuery)
```

#### Etapa 3: Formatação Natural
```typescript
// OpenAI formata dados em linguagem natural
const finalCompletion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: formatPrompt + dados },
    ...messages,
  ],
  temperature: 0.7, // Criativo para texto natural
})
```

### 3. **MCP Server** (`src/mcp/server.ts`) [OPCIONAL/FUTURO]

**Status**: ✅ Implementado mas não integrado ainda

**Ferramentas Disponíveis**:
1. `consultar_tff` - Consultas TFF estruturadas
2. `consultar_iptu` - Consultas IPTU estruturadas
3. `consulta_sql_customizada` - SQL customizado com validação

**Quando usar MCP**:
- Para escalar o sistema com múltiplos clientes
- Para adicionar ferramentas complexas (cálculos, projeções)
- Para auditoria e logging centralizado

## 📊 Banco de Dados

**PostgreSQL**: 10.0.20.61:5432/metabase

**Tabelas Principais**:
- `tb_tff_2025` - Taxa de Fiscalização de Funcionamento
- `tb_arrec_iptu_2025` - Arrecadação IPTU 2025
- `tb_lanc_arrec_iptu_2025` - Lançado vs Arrecadado
- `tb_arrec_iptu_5_anos` - Histórico 2020-2025
- `tb_cota_unica_iptu_2025` - Top 100 cota única
- `tb_parcelados_iptu_2025` - Top 100 parcelados
- `tb_maiores_devedores_iptu_2025` - Top devedores

## 🎯 Exemplos de Uso

### Pergunta do Usuário

```
"Qual o valor arrecadado da TFF em 2025?"
```

### Resposta do Sistema

```
📊 NÚMEROS PRINCIPAIS
- Valor Lançado: R$ 27.119.034,80
- Valor Arrecadado: R$ 16.120.000,00
- Taxa de Arrecadação: 59,45%
- Contribuintes: 10.437

📈 ANÁLISE
A arrecadação de TFF em 2025 está em R$ 16,12 milhões, representando 
59,45% do total lançado. Ainda há R$ 11 milhões a arrecadar.

🎯 INSIGHTS
Recomenda-se intensificar ações de cobrança para melhorar a taxa de 
arrecadação, que está abaixo da meta de 70%.
```

## 🔒 Segurança

### Validações Implementadas

1. **SQL Injection**: Apenas SELECT permitido
2. **Credenciais**: Variáveis de ambiente (`.env.local`)
3. **Rate Limiting**: Timeout de 60s por requisição
4. **Error Handling**: Mensagens genéricas para usuário

### Variáveis de Ambiente Necessárias

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://postgres:CEnIg8shcyeF@10.0.20.61:5432/metabase
```

## 🚀 Deployment

### Desenvolvimento
```bash
npm run dev
# Acesse: http://localhost:3000
```

### Produção
```bash
npm run build
npm start
```

### Verificação
1. Abra o navegador em http://localhost:3000
2. Faça login (se necessário)
3. Clique no ícone do chatbot (canto inferior direito)
4. Faça uma pergunta: "Quanto arrecadamos de IPTU?"

## 📈 Melhorias Futuras

### Curto Prazo
- [ ] Integrar MCP Server para ferramentas avançadas
- [ ] Adicionar streaming de respostas
- [ ] Implementar histórico de conversas
- [ ] Cache de consultas frequentes

### Médio Prazo
- [ ] Múltiplos modelos de IA (fallback)
- [ ] Análises preditivas
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Integração com dashboards Metabase

### Longo Prazo
- [ ] Multi-tenant (múltiplos municípios)
- [ ] API pública para integrações
- [ ] Mobile app (React Native)
- [ ] Voice interface (speech-to-text)

## 🐛 Troubleshooting

### Problema: "Consultando dados..." infinito
**Solução**: Verificar logs do servidor para erro na query SQL

### Problema: "Erro de conexão com o servidor"
**Solução**: Verificar se PostgreSQL está acessível (10.0.20.61:5432)

### Problema: Resposta com JSON/SQL visível
**Solução**: Aumentar temperature na Etapa 3 (linha 247)

### Problema: Resposta genérica sem dados
**Solução**: Verificar se SQL foi gerado corretamente (logs Etapa 1)

## 📚 Documentação Técnica

### System Prompt

O `SYSTEM_PROMPT` define o comportamento da IA:

**Características**:
- Especialista tributário de Camaçari-BA
- Responde em linguagem natural
- Formato executivo: 📊 Números → 📈 Análise → 🎯 Insights
- Valores em formato brasileiro (R$ 1.234,56)
- Proativo com sugestões de análises

### Temperatures

- **SQL Generation**: 0.0 (determinístico)
- **Natural Language**: 0.7 (criativo mas consistente)

### Tokens

- **Max Tokens SQL**: 300 (consultas curtas)
- **Max Tokens Response**: 1000 (respostas detalhadas)

## 👥 Equipe

- **Arquitetura**: Refatoração para comunicação natural
- **IA/ML**: OpenAI GPT-4o-mini com Function Calling
- **Backend**: Next.js 14 + PostgreSQL
- **Frontend**: React 18 + TypeScript

## 📝 Changelog

### v2.0.0 (Refatoração Atual)
- ✅ Simplificado para linguagem natural
- ✅ Removido filtros agressivos de frontend
- ✅ Melhorado SYSTEM_PROMPT com exemplos claros
- ✅ Temperature ajustada (0.7 para respostas)
- ✅ Timeout protection (60s)
- ✅ MCP Server implementado (não integrado)

### v1.0.0 (Versão Anterior)
- Dual-call workflow (SQL + Format)
- Filtragem de JSON no frontend
- Temperature 0.3 (muito conservador)
- Problemas com respostas técnicas vazando

---

**Última Atualização**: 24/10/2025  
**Versão**: 2.0.0  
**Status**: ✅ Produção
