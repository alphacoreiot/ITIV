# Guia de Testes - Chatbot Tributário

## ✅ Como Testar o Sistema Refatorado

### 1. Iniciar o Servidor

```bash
cd d:\DEV\PREFEITURA\ITIV
npm run dev
```

Aguarde a mensagem: `✓ Ready in X.Xs`

### 2. Acessar a Interface

Abra o navegador em: **http://localhost:3000**

### 3. Perguntas de Teste

#### 🔹 Teste 1: TFF - Resumo Geral

**Pergunta**: 
```
Qual o valor arrecadado da TFF em 2025?
```

**Resposta Esperada**:
- Valores lançados e arrecadados
- Taxa de arrecadação em %
- Quantidade de contribuintes
- Linguagem natural (sem SQL/JSON)

#### 🔹 Teste 2: IPTU - Arrecadação

**Pergunta**:
```
Quanto arrecadamos de IPTU este ano?
```

**Resposta Esperada**:
- Total arrecadado por tributo (IPTU, TRSD, COSIP)
- Comparativo cota única vs parcelado
- Análise da arrecadação

#### 🔹 Teste 3: Comparativo

**Pergunta**:
```
Compare a arrecadação de TFF entre 2024 e 2025
```

**Resposta Esperada**:
- Dados dos dois anos lado a lado
- Variação percentual
- Análise de crescimento/redução

#### 🔹 Teste 4: Análise por Segmento

**Pergunta**:
```
Quais segmentos econômicos pagam mais TFF?
```

**Resposta Esperada**:
- Ranking de segmentos (Indústria, Comércio, Serviços)
- Valores por segmento
- Insights sobre concentração

#### 🔹 Teste 5: Top Contribuintes

**Pergunta**:
```
Mostre os 10 maiores contribuintes de IPTU
```

**Resposta Esperada**:
- Lista dos top 10
- Valores pagos
- Modalidade de pagamento

#### 🔹 Teste 6: Análise Geográfica

**Pergunta**:
```
Quais bairros arrecadam mais IPTU?
```

**Resposta Esperada**:
- Top 10 bairros
- Valores por bairro
- Análise de distribuição geográfica

#### 🔹 Teste 7: Inadimplência

**Pergunta**:
```
Quem são os maiores devedores de IPTU?
```

**Resposta Esperada**:
- Lista de devedores
- Valores pendentes
- Situação das parcelas

### 4. Verificar Logs do Servidor

No terminal onde o servidor está rodando, observe:

```
📨 [Chatbot] Recebendo requisição...
🔍 Etapa 1: Gerando SQL...
📄 Resposta SQL: {"needsQuery":true,"sqlQuery":"SELECT..."}
✅ SQL extraído: SELECT ...
🔍 Etapa 2: Executando consulta...
✅ Consulta executada: X linhas
Etapa 3: Formatando resposta...
✅ Resposta formatada com sucesso
```

### 5. Checklist de Qualidade

- [ ] Resposta em linguagem natural (português)
- [ ] Valores formatados (R$ 1.234,56)
- [ ] Percentuais com 2 casas decimais (45,32%)
- [ ] SEM menção a SQL, JSON ou tabelas
- [ ] Tom executivo e profissional
- [ ] Inclui números + análise + insights
- [ ] Responde em menos de 10 segundos
- [ ] Sem erros no console do navegador

### 6. Testes de Erro

#### Teste de Timeout

**Pergunta**: 
```
SELECT * FROM tb_tff_2025 LIMIT 1000000
```

**Comportamento Esperado**:
- Após 60s: "A consulta está demorando. Tente reformular a pergunta."

#### Teste de Pergunta Vaga

**Pergunta**:
```
oi
```

**Comportamento Esperado**:
- IA pede esclarecimento ou sugere perguntas

#### Teste de Banco Indisponível

**Simular**: Desligar PostgreSQL

**Comportamento Esperado**:
- "Erro ao processar sua pergunta"
- Sem crash do servidor

### 7. Testes de Performance

| Métrica | Meta | Como Medir |
|---------|------|------------|
| Tempo de Resposta | < 10s | DevTools Network tab |
| Uso de Memória | < 500MB | Task Manager (Node.js) |
| Tokens OpenAI | < 2000/req | Logs da API |

### 8. Testes de Regressão

Garanta que funcionalidades antigas ainda funcionam:

- [ ] Login no sistema
- [ ] Navegação entre páginas
- [ ] Dashboards Metabase (BI-TFF, BI-IPTU)
- [ ] Notícias na home
- [ ] Widget de clima

### 9. Testes de Segurança

#### SQL Injection
**Pergunta**:
```
'; DROP TABLE tb_tff_2025; --
```

**Comportamento Esperado**:
- Query não executada
- IA trata como pergunta normal

#### Exposição de Credenciais
**Verificar**:
- Logs não mostram senhas
- .env.local no .gitignore
- Respostas não vazam detalhes técnicos

### 10. Critérios de Aceitação

✅ **Passa** se:
- 100% das perguntas de teste retornam respostas
- Linguagem natural em todas as respostas
- Sem erros no console
- Performance dentro das metas
- Segurança validada

❌ **Falha** se:
- Respostas com JSON/SQL visível
- Erros 500 frequentes
- Timeout em perguntas simples
- Vazamento de informações técnicas

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs do servidor
2. Verificar conexão com PostgreSQL (10.0.20.61:5432)
3. Verificar variável `OPENAI_API_KEY` em `.env.local`
4. Reiniciar servidor: `npm run dev`

**Contato Técnico**: [Seu contato aqui]

---

**Data**: 24/10/2025  
**Versão**: 2.0.0  
**Status**: ✅ Pronto para Testes
