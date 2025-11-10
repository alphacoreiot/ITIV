const { Pool } = require('pg')

const pool = new Pool({
  host: '10.0.20.61',
  port: 5432,
  database: 'metabase',
  user: 'postgres',
  password: 'CEnIg8shcyeF',
})

async function checkSchema() {
  console.log('\n📊 Verificando Schema Completo do SSO...\n')

  try {
    // sso_usuarios
    console.log('1️⃣ sso_usuarios:')
    const usuarios = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sso_usuarios'
      ORDER BY ordinal_position
    `)
    usuarios.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`))

    // sso_aplicacoes
    console.log('\n2️⃣ sso_aplicacoes:')
    const aplicacoes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sso_aplicacoes'
      ORDER BY ordinal_position
    `)
    aplicacoes.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`))

    // sso_modulos
    console.log('\n3️⃣ sso_modulos:')
    const modulos = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sso_modulos'
      ORDER BY ordinal_position
    `)
    modulos.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`))

    // sso_usuario_aplicacao
    console.log('\n4️⃣ sso_usuario_aplicacao:')
    const usuarioApp = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sso_usuario_aplicacao'
      ORDER BY ordinal_position
    `)
    usuarioApp.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`))

    // sso_usuario_modulo
    console.log('\n5️⃣ sso_usuario_modulo:')
    const usuarioMod = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sso_usuario_modulo'
      ORDER BY ordinal_position
    `)
    usuarioMod.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`))

    // sso_permissoes
    console.log('\n6️⃣ sso_permissoes:')
    const permissoes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sso_permissoes'
      ORDER BY ordinal_position
    `)
    permissoes.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`))

    // Verificar dados existentes
    console.log('\n\n📦 Dados Existentes:\n')
    
    const app = await pool.query(`SELECT * FROM sso_aplicacoes WHERE nome ILIKE '%smart%'`)
    console.log('Aplicação Smart Sefaz:', app.rows[0])

    const mods = await pool.query(`SELECT * FROM sso_modulos LIMIT 3`)
    console.log('\nMódulos (primeiros 3):', mods.rows)

    const users = await pool.query(`SELECT id, nome, email, ativo FROM sso_usuarios WHERE ativo = true LIMIT 3`)
    console.log('\nUsuários ativos (primeiros 3):', users.rows)

    const perms = await pool.query(`SELECT * FROM sso_permissoes`)
    console.log('\nPermissões disponíveis:', perms.rows)

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

checkSchema()
