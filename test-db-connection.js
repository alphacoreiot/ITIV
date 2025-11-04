const { Pool } = require('pg');

const pool = new Pool({
  host: '10.0.20.61',
  port: 5432,
  database: 'metabase',
  user: 'postgres',
  password: 'CEnIg8shcyeF',
});

async function testConnection() {
  try {
    console.log('🔍 Verificando conexão com o banco...');
    
    // Testar conexão
    const testConn = await pool.query('SELECT NOW()');
    console.log('✅ Conexão OK:', testConn.rows[0].now);
    
    // Listar tabelas com 'refis'
    console.log('\n📋 Listando tabelas com "refis" no nome...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%refis%'
      ORDER BY table_name
    `;
    const tables = await pool.query(tablesQuery);
    console.log('Tabelas encontradas:', tables.rows.map(r => r.table_name));
    
    // Verificar se tb_refis_analitico_2025 existe
    console.log('\n🔍 Verificando tb_refis_analitico_2025...');
    const checkTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'tb_refis_analitico_2025'
      )
    `;
    const tableExists = await pool.query(checkTable);
    console.log('tb_refis_analitico_2025 existe?', tableExists.rows[0].exists);
    
    // Se não existe, verificar tb_refis_2025
    if (!tableExists.rows[0].exists) {
      console.log('\n🔍 Verificando tb_refis_2025...');
      const checkTable2 = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tb_refis_2025'
        ORDER BY ordinal_position
      `);
      console.log('\nColunas de tb_refis_2025:');
      checkTable2.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Testar query com email e telefone
      console.log('\n🧪 Testando query com email e telefone...');
      const userQuery = `
        SELECT
          contribuinte,
          cpf_cnpj,
          email,
          telefone,
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
          dtlancamento,
          dtlancamento + INTERVAL '10 days' AS dt_vencimento,
          CURRENT_DATE - (dtlancamento + INTERVAL '10 days')::date AS dias_atraso
        FROM
          tb_refis_analitico_2025
        WHERE
          dtlancamento IS NOT NULL
        LIMIT 5
      `;
      
      const testResult = await pool.query(userQuery);
      console.log(`✅ Query executada com sucesso! ${testResult.rows.length} linhas retornadas`);
      console.log('Primeiro registro:', JSON.stringify(testResult.rows[0], null, 2));
    } else {
      // Se tb_refis_analitico_2025 existe, mostrar colunas
      console.log('\n📋 Colunas de tb_refis_analitico_2025:');
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tb_refis_analitico_2025'
        ORDER BY ordinal_position
      `);
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Testar query com analitico
      console.log('\n🧪 Testando query com tb_refis_analitico_2025...');
      const analyticQuery = `
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
          dtlancamento,
          dtlancamento + INTERVAL '10 days' AS dt_vencimento,
          CURRENT_DATE - (dtlancamento + INTERVAL '10 days')::date AS dias_atraso
        FROM
          tb_refis_analitico_2025
        WHERE
          dtlancamento IS NOT NULL
        LIMIT 5
      `;
      
      const testResult = await pool.query(analyticQuery);
      console.log(`✅ Query executada com sucesso! ${testResult.rows.length} linhas retornadas`);
      console.log('Primeiro registro:', JSON.stringify(testResult.rows[0], null, 2));
    }
    
    // Verificar tb_refis_dados_complementares
    console.log('\n📋 Verificando tb_refis_dados_complementares...');
    const complementarQuery = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tb_refis_dados_complementares'
      ORDER BY ordinal_position
    `);
    console.log('Colunas de tb_refis_dados_complementares:');
    complementarQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Testar query com JOIN
    console.log('\n🧪 Testando query com JOIN para buscar email/telefone...');
    const joinQuery = `
      SELECT
        a.contribuinte,
        a.cpf_cnpj,
        c.email,
        c.telefone,
        a.tipo_pessoa,
        a.vl_total_negociado,
        a.situacao_pagamento,
        a.cidade,
        a.bairro,
        a.dtlancamento,
        a.dtlancamento + INTERVAL '10 days' AS dt_vencimento,
        CURRENT_DATE - (a.dtlancamento + INTERVAL '10 days')::date AS dias_atraso
      FROM
        tb_refis_analitico_2025 a
      LEFT JOIN
        tb_refis_dados_complementares c ON a.cpf_cnpj = c.cpf_cnpj
      WHERE
        a.dtlancamento IS NOT NULL
      LIMIT 5
    `;
    
    const joinResult = await pool.query(joinQuery);
    console.log(`✅ Query JOIN executada! ${joinResult.rows.length} linhas`);
    console.log('Primeiro registro:', JSON.stringify(joinResult.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
