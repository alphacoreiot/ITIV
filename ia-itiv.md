# 📊 Consultas REFIS Analítico - Metabase
## Tabela: tb_refis_analitico_2025

---

## 1️⃣ RESUMO GERAL POR PERCENTUAL DE ENTRADA

```sql
SELECT 
  percentual_entrada,
  COUNT(*) AS qtd_contribuintes,
  ROUND(SUM(vl_total_negociado), 2) AS vl_total_negociado,
  ROUND(AVG(vl_total_negociado), 2) AS vl_medio_por_contribuinte,
  ROUND(SUM(vl_arrecadado), 2) AS vl_arrecadado,
  ROUND(SUM(vl_desconto_obtido), 2) AS vl_total_desconto
FROM tb_refis_analitico_2025
GROUP BY percentual_entrada
ORDER BY percentual_entrada DESC;
```

**Use para:** Visão executiva - Dashboard principal

---

## 2️⃣ FILTRAR CONTRIBUINTES QUE ESCOLHERAM 100% DE ENTRADA

```sql
SELECT 
  contribuinte,
  cpf_cnpj,
  tipo_pessoa,
  vl_total_negociado,
  vl_arrecadado,
  situacao_pagamento,
  qtd_parcelas_total,
  qtd_parcelas_pagas,
  dtlancamento,
  cidade,
  bairro
FROM tb_refis_analitico_2025
WHERE percentual_entrada = 100.0
ORDER BY vl_total_negociado DESC;
```

**Use para:** Ver quem aderiu com pagamento à vista (100%)

---

## 3️⃣ CONTRIBUINTES 100% QUE PAGARAM vs NÃO PAGARAM

```sql
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
ORDER BY qtd_contribuintes DESC;
```

**Use para:** Dashboard - Gráfico de pizza/barras mostrando quem pagou

---

## 4️⃣ DETALHAMENTO: 100% QUE QUITARAM

```sql
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
  cidade,
  bairro
FROM tb_refis_analitico_2025
WHERE percentual_entrada = 100.0
  AND situacao_pagamento = 'QUITADO'
ORDER BY vl_total_negociado DESC;
```

**Use para:** Lista de sucessos - Quitações 100%

---

## 5️⃣ DETALHAMENTO: 100% QUE NÃO PAGARAM

```sql
SELECT 
  contribuinte,
  cpf_cnpj,
  tipo_pessoa,
  vl_total_negociado,
  qtd_parcelas_total,
  qtd_parcelas_pagas,
  qtd_parcelas_abertas,
  dtlancamento,
  cidade,
  bairro,
  status_refis
FROM tb_refis_analitico_2025
WHERE percentual_entrada = 100.0
  AND situacao_pagamento = 'NÃO PAGOU'
ORDER BY vl_total_negociado DESC;
```

**Use para:** Priorizar cobranças - Inadimplentes 100%

---

## 6️⃣ ANÁLISE COMPLETA POR PERCENTUAL (COM FILTRO VARIÁVEL)

```sql
-- Substitua {{percentual}} por um parâmetro do Metabase
SELECT 
  contribuinte,
  cpf_cnpj,
  tipo_pessoa,
  vl_total_negociado,
  vl_arrecadado,
  situacao_pagamento,
  qtd_parcelas_total,
  qtd_parcelas_pagas,
  perc_parcelas_pagas,
  vl_parcela_media,
  faixa_parcelamento,
  cidade,
  bairro,
  dtlancamento
FROM tb_refis_analitico_2025
WHERE percentual_entrada = {{percentual}}
ORDER BY vl_total_negociado DESC;
```

**Use para:** Dashboard interativo com filtro de percentual

**Como criar o parâmetro no Metabase:**
1. Editar a pergunta
2. Clicar em "Variables" (ícone {})
3. Adicionar variável: `percentual` tipo "Number"
4. Valores sugeridos: 10, 12, 14, 17, 20, 25, 30, 33, 40, 50, 75, 100

---

## 7️⃣ ANÁLISE DE INADIMPLÊNCIA POR PERCENTUAL

```sql
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
ORDER BY percentual_entrada DESC, situacao_pagamento;
```

**Use para:** Cruzamento percentual de entrada x situação de pagamento

---

## 8️⃣ TOP 20 MAIORES ADESÕES (QUALQUER PERCENTUAL)

```sql
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
LIMIT 20;
```

**Use para:** Ranking dos maiores contribuintes do REFIS

---

## 9️⃣ ANÁLISE POR FAIXA DE PARCELAMENTO E PERCENTUAL

```sql
SELECT 
  faixa_parcelamento,
  percentual_entrada,
  COUNT(*) AS qtd_contribuintes,
  ROUND(SUM(vl_total_negociado), 2) AS vl_total,
  ROUND(AVG(vl_parcela_media), 2) AS vl_medio_parcela
FROM tb_refis_analitico_2025
GROUP BY faixa_parcelamento, percentual_entrada
ORDER BY faixa_parcelamento, percentual_entrada DESC;
```

**Use para:** Análise cruzada: parcelas x entrada

---

## 🔟 ANÁLISE GEOGRÁFICA POR PERCENTUAL

```sql
SELECT 
  percentual_entrada,
  cidade,
  bairro,
  COUNT(*) AS qtd_contribuintes,
  ROUND(SUM(vl_total_negociado), 2) AS vl_total,
  ROUND(SUM(vl_arrecadado), 2) AS vl_arrecadado
FROM tb_refis_analitico_2025
WHERE cidade IS NOT NULL
GROUP BY percentual_entrada, cidade, bairro
ORDER BY percentual_entrada DESC, vl_total DESC;
```

**Use para:** Mapa de calor - Distribuição geográfica do REFIS

---

## 1️⃣1️⃣ ANÁLISE POR TIPO DE PESSOA E PERCENTUAL

```sql
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
ORDER BY percentual_entrada DESC, tipo_pessoa;
```

**Use para:** Comparar comportamento PF vs PJ por percentual de entrada

---

## 1️⃣2️⃣ EVOLUÇÃO TEMPORAL DE ADESÕES POR PERCENTUAL

```sql
SELECT 
  percentual_entrada,
  DATE_TRUNC('month', dtlancamento) AS mes_adesao,
  COUNT(*) AS qtd_adesoes,
  ROUND(SUM(vl_total_negociado), 2) AS vl_total
FROM tb_refis_analitico_2025
WHERE dtlancamento IS NOT NULL
GROUP BY percentual_entrada, DATE_TRUNC('month', dtlancamento)
ORDER BY percentual_entrada DESC, mes_adesao;
```

**Use para:** Gráfico de linhas - Evolução mensal por percentual

---

## 1️⃣3️⃣ STATUS DO REFIS POR PERCENTUAL

```sql
SELECT 
  percentual_entrada,
  status_refis,
  COUNT(*) AS qtd_contribuintes,
  ROUND(SUM(vl_total_negociado), 2) AS vl_total
FROM tb_refis_analitico_2025
GROUP BY percentual_entrada, status_refis
ORDER BY percentual_entrada DESC, qtd_contribuintes DESC;
```

**Use para:** Ver adesões, exclusões, cancelamentos por percentual

---

## 1️⃣4️⃣ HONORÁRIOS POR PERCENTUAL

```sql
SELECT 
  percentual_entrada,
  COUNT(*) AS qtd_contribuintes,
  ROUND(SUM(vl_honorario_negociado), 2) AS vl_honorario_negociado,
  ROUND(SUM(vl_honorario_arrecadado), 2) AS vl_honorario_arrecadado,
  ROUND(
    (SUM(vl_honorario_arrecadado) / NULLIF(SUM(vl_honorario_negociado), 0)) * 100, 2
  ) AS perc_honorario_arrecadado
FROM tb_refis_analitico_2025
WHERE vl_honorario_negociado > 0
GROUP BY percentual_entrada
ORDER BY percentual_entrada DESC;
```

**Use para:** Análise de arrecadação de honorários

