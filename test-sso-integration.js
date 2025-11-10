const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  host: '10.0.20.61',
  port: 5432,
  database: 'metabase',
  user: 'postgres',
  password: 'CEnIg8shcyeF',
})

const APP_ID = 'ac86e8c4-32f6-4103-b544-12836864fc43'

async function testSSO() {
  console.log('\n🔍 Testando Integração SSO...\n')

  try {
    // 0. Verificar schema das tabelas SSO
    console.log('0️⃣ Verificando estrutura das tabelas SSO...')
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'sso_%'
      ORDER BY table_name
    `)
    console.log(`   📋 ${tables.rows.length} tabelas SSO encontradas:`)
    tables.rows.forEach(t => console.log(`      - ${t.table_name}`))

    // Verificar colunas da tabela sso_aplicacoes
    console.log('\n   🔍 Estrutura de sso_aplicacoes:')
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sso_aplicacoes'
      ORDER BY ordinal_position
    `)
    columns.rows.forEach(c => console.log(`      - ${c.column_name}: ${c.data_type}`))

    // 1. Verificar aplicação Smart Sefaz
    console.log('\n1️⃣ Verificando aplicação Smart Sefaz...')
    const app = await pool.query(
      'SELECT * FROM sso_aplicacoes WHERE nome ILIKE $1',
      ['%smart%']
    )
    if (app.rows.length > 0) {
      console.log(`   ✅ Aplicação encontrada:`)
      console.log(`      Nome: ${app.rows[0].nome}`)
      console.log(`      Ativa: ${app.rows[0].ativa}`)
      console.log(`      Colunas disponíveis:`, Object.keys(app.rows[0]))
    } else {
      console.log('   ⚠️  Aplicação não encontrada')
    }

    // 2. Listar módulos disponíveis
    console.log('\n2️⃣ Listando módulos cadastrados...')
    const modules = await pool.query(
      'SELECT * FROM sso_modulos WHERE aplicacao_id = $1 ORDER BY nome',
      [APP_ID]
    )
    console.log(`   📦 ${modules.rows.length} módulos encontrados:`)
    modules.rows.forEach((m, i) => {
      console.log(`      ${i + 1}. ${m.nome} (${m.caminho}) - Ativo: ${m.ativo}`)
    })

    // 3. Verificar usuários ativos com acesso
    console.log('\n3️⃣ Verificando usuários com acesso...')
    const users = await pool.query(`
      SELECT u.usuario_id, u.nome, u.email, u.usuario_ativo,
             ua.acesso_aplicacao
      FROM sso_usuarios u
      LEFT JOIN sso_usuario_aplicacao ua 
        ON u.usuario_id = ua.usuario_id 
        AND ua.aplicacao_id = $1
      WHERE u.usuario_ativo = true
      ORDER BY u.nome
    `, [APP_ID])
    
    console.log(`   👥 ${users.rows.length} usuários ativos:`)
    users.rows.forEach((u, i) => {
      const hasAccess = u.acesso_aplicacao ? '✅' : '❌'
      console.log(`      ${i + 1}. ${u.nome} (${u.email}) ${hasAccess}`)
    })

    // 4. Verificar permissões dos usuários
    console.log('\n4️⃣ Verificando permissões dos usuários...')
    const permissions = await pool.query(`
      SELECT u.nome, u.email, m.nome as modulo, m.caminho, um.permissoes
      FROM sso_usuario_modulo um
      INNER JOIN sso_usuarios u ON um.usuario_id = u.usuario_id
      INNER JOIN sso_modulos m ON um.modulo_id = m.modulo_id
      WHERE m.aplicacao_id = $1 AND u.usuario_ativo = true
      ORDER BY u.nome, m.nome
    `, [APP_ID])

    if (permissions.rows.length > 0) {
      console.log(`   🔑 ${permissions.rows.length} permissões configuradas:`)
      permissions.rows.forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.nome} → ${p.modulo} (${p.caminho})`)
        console.log(`         Permissões: ${p.permissoes.join(', ')}`)
      })
    } else {
      console.log('   ⚠️  Nenhuma permissão configurada!')
      console.log('   💡 Execute os scripts SQL para criar módulos e atribuir permissões')
    }

    // 5. Testar validação de senha de um usuário (se existir)
    if (users.rows.length > 0) {
      console.log('\n5️⃣ Testando validação de senha...')
      const testUser = users.rows[0]
      const userWithPass = await pool.query(
        'SELECT senha FROM sso_usuarios WHERE usuario_id = $1',
        [testUser.usuario_id]
      )
      
      if (userWithPass.rows[0]?.senha) {
        const hashedPass = userWithPass.rows[0].senha
        console.log(`   👤 Usuário: ${testUser.email}`)
        console.log(`   🔐 Senha está hashada com bcrypt: ${hashedPass.startsWith('$2')}`)
      }
    }

    console.log('\n✅ Teste concluído com sucesso!\n')

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await pool.end()
  }
}

testSSO()
