const { Pool } = require('pg');

const pool = new Pool({
  host: '10.0.20.61',
  port: 5432,
  database: 'metabase',
  user: 'postgres',
  password: 'CEnIg8shcyeF',
});

async function verifySSO() {
  try {
    console.log('🔍 Verificando tabelas SSO...\n');
    
    // Listar tabelas SSO
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'sso_%'
      ORDER BY table_name
    `;
    const tables = await pool.query(tablesQuery);
    
    console.log('📋 Tabelas SSO encontradas:');
    if (tables.rows.length === 0) {
      console.log('❌ Nenhuma tabela SSO encontrada!');
      console.log('\n⚠️  As tabelas SSO precisam ser criadas primeiro.');
      console.log('Execute o script SQL de criação das tabelas do SSO.');
      return;
    }
    
    tables.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    
    // Verificar aplicação "Smart Sefaz"
    console.log('\n🔍 Procurando aplicação "Smart Sefaz"...');
    const appQuery = `
      SELECT id, nome, chave_api, ativo, url
      FROM sso_aplicacoes
      WHERE LOWER(nome) LIKE '%smart%sefaz%'
         OR LOWER(nome) LIKE '%smart sefaz%'
      LIMIT 1
    `;
    const app = await pool.query(appQuery);
    
    if (app.rows.length > 0) {
      console.log('✅ Aplicação encontrada:');
      console.log(`   ID: ${app.rows[0].id}`);
      console.log(`   Nome: ${app.rows[0].nome}`);
      console.log(`   Chave API: ${app.rows[0].chave_api}`);
      console.log(`   Ativa: ${app.rows[0].ativo ? 'Sim' : 'Não'}`);
      console.log(`   URL: ${app.rows[0].url || 'Não configurada'}`);
      
      // Verificar módulos
      console.log('\n📦 Módulos da aplicação:');
      const modulesQuery = `
        SELECT id, nome, rota, ativo
        FROM sso_modulos
        WHERE aplicacao_id = $1
        ORDER BY ordem, nome
      `;
      const modules = await pool.query(modulesQuery, [app.rows[0].id]);
      
      if (modules.rows.length > 0) {
        modules.rows.forEach(mod => {
          console.log(`   ${mod.ativo ? '✓' : '✗'} ${mod.nome} (${mod.rota}) - ID: ${mod.id}`);
        });
      } else {
        console.log('   ⚠️  Nenhum módulo cadastrado');
      }
      
      // Criar arquivo .env.sso
      const envContent = `# Configuração SSO - Smart Sefaz
SSO_APP_ID=${app.rows[0].id}
SSO_API_KEY=${app.rows[0].chave_api}
SSO_DB_HOST=10.0.20.61
SSO_DB_PORT=5432
SSO_DB_NAME=metabase
SSO_DB_USER=postgres
SSO_DB_PASS=CEnIg8shcyeF

# IDs dos Módulos${modules.rows.length > 0 ? '\n' + modules.rows.map(m => 
  `SSO_MODULE_${m.nome.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '')}=${m.id}`
).join('\n') : '\n# (Cadastre os módulos no SSO)'}
`;
      
      const fs = require('fs');
      fs.writeFileSync('.env.sso', envContent);
      console.log('\n✅ Arquivo .env.sso criado com sucesso!');
      
    } else {
      console.log('❌ Aplicação "Smart Sefaz" não encontrada!');
      console.log('\n📝 Você precisa cadastrar a aplicação no SSO:');
      console.log('   1. Acesse o painel SSO');
      console.log('   2. Vá em Aplicações > Nova Aplicação');
      console.log('   3. Preencha:');
      console.log('      - Nome: Smart Sefaz');
      console.log('      - Descrição: Sistema de Gestão SEFAZ');
      console.log('      - URL: http://localhost:3000');
      console.log('      - Cor: #ec212a');
      console.log('   4. Cadastre os módulos:');
      console.log('      - Dashboard (/dashboard)');
      console.log('      - BI REFIS (/bi-refis)');
      console.log('      - BI IPTU (/bi-iptu)');
      console.log('      - BI TFF (/bi-tff)');
      console.log('      - BI REFIS Percentuais (/bi-refis-percentuais)');
    }
    
    // Verificar usuários
    console.log('\n👥 Usuários cadastrados no SSO:');
    const usersQuery = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE ativo = true) as ativos FROM sso_usuarios`;
    const users = await pool.query(usersQuery);
    console.log(`   Total: ${users.rows[0].total} (${users.rows[0].ativos} ativos)`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Não foi possível conectar ao banco de dados.');
    } else if (error.code === '42P01') {
      console.log('\n⚠️  Tabelas SSO não existem no banco.');
      console.log('Execute o script SQL de criação das tabelas primeiro.');
    }
  } finally {
    await pool.end();
  }
}

verifySSO();
