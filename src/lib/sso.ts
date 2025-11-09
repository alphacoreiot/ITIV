import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// Configuração do banco SSO
const ssoPool = new Pool({
  host: process.env.SSO_DB_HOST || '10.0.20.61',
  port: parseInt(process.env.SSO_DB_PORT || '5432'),
  database: process.env.SSO_DB_NAME || 'metabase',
  user: process.env.SSO_DB_USER || 'postgres',
  password: process.env.SSO_DB_PASS || 'CEnIg8shcyeF',
})

const SSO_APP_ID = process.env.SSO_APP_ID || 'ac86e8c4-32f6-4103-b544-12836864fc43'

// Interface do usuário SSO
export interface SSOUser {
  id: string
  email: string
  nome: string
  cpf: string
  ativo: boolean
  cargo?: string
  departamento?: string
  foto_url?: string
}

// Interface de permissões
export interface UserPermissions {
  hasAccess: boolean
  modules: {
    id: string
    nome: string
    rota: string
    permissions: string[] // ['READ', 'WRITE', 'DELETE', 'ADMIN']
  }[]
}

/**
 * Valida login do usuário no SSO
 */
export async function validateSSOLogin(
  email: string,
  senha: string
): Promise<SSOUser | null> {
  const client = await ssoPool.connect()
  
  try {
    // Buscar usuário por email
    const userResult = await client.query(
      `SELECT id, email, nome, cpf, senha, ativo, cargo, departamento, foto_url
       FROM sso_usuarios
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    )

    if (userResult.rows.length === 0) {
      console.log('[SSO] Usuário não encontrado:', email)
      return null
    }

    const usuario = userResult.rows[0]

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      console.log('[SSO] Usuário inativo:', email)
      return null
    }

    // Validar senha com bcrypt
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      console.log('[SSO] Senha inválida para:', email)
      return null
    }

    // Verificar se usuário tem acesso à aplicação Smart Sefaz
    const acessoResult = await client.query(
      `SELECT 1 FROM sso_usuario_aplicacao
       WHERE usuario_id = $1
         AND aplicacao_id = $2
         AND ativo = true
         AND (data_expiracao IS NULL OR data_expiracao >= NOW())`,
      [usuario.id, SSO_APP_ID]
    )

    if (acessoResult.rows.length === 0) {
      console.log('[SSO] Usuário sem acesso à aplicação Smart Sefaz:', email)
      return null
    }

    // Atualizar último acesso
    await client.query(
      `UPDATE sso_usuarios SET ultimo_acesso = NOW() WHERE id = $1`,
      [usuario.id]
    )

    console.log('[SSO] Login bem-sucedido:', email)

    return {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      cpf: usuario.cpf,
      ativo: usuario.ativo,
      cargo: usuario.cargo,
      departamento: usuario.departamento,
      foto_url: usuario.foto_url,
    }
  } catch (error) {
    console.error('[SSO] Erro ao validar login:', error)
    return null
  } finally {
    client.release()
  }
}

/**
 * Obtém permissões do usuário na aplicação
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const client = await ssoPool.connect()

  try {
    // Verificar se tem acesso à aplicação
    const acessoResult = await client.query(
      `SELECT 1 FROM sso_usuario_aplicacao
       WHERE usuario_id = $1
         AND aplicacao_id = $2
         AND ativo = true
         AND (data_expiracao IS NULL OR data_expiracao >= NOW())`,
      [userId, SSO_APP_ID]
    )

    if (acessoResult.rows.length === 0) {
      return { hasAccess: false, modules: [] }
    }

    // Buscar módulos e permissões
    const permissoesResult = await client.query(
      `SELECT 
         m.id,
         m.nome,
         m.rota,
         COALESCE(
           json_agg(
             DISTINCT p.codigo
             ORDER BY p.codigo
           ) FILTER (WHERE p.codigo IS NOT NULL),
           '[]'
         ) as permissions
       FROM sso_modulos m
       LEFT JOIN sso_usuario_modulo um ON um.modulo_id = m.id 
         AND um.usuario_id = $1
         AND um.ativo = true
         AND (um.data_expiracao IS NULL OR um.data_expiracao >= NOW())
       LEFT JOIN sso_permissoes p ON p.id = um.permissao_id
       WHERE m.aplicacao_id = $2
         AND m.ativo = true
       GROUP BY m.id, m.nome, m.rota
       ORDER BY m.ordem, m.nome`,
      [userId, SSO_APP_ID]
    )

    const modules = permissoesResult.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      rota: row.rota,
      permissions: row.permissions || [],
    }))

    return {
      hasAccess: true,
      modules,
    }
  } catch (error) {
    console.error('[SSO] Erro ao obter permissões:', error)
    return { hasAccess: false, modules: [] }
  } finally {
    client.release()
  }
}

/**
 * Verifica se usuário tem permissão específica em um módulo
 */
export async function checkModulePermission(
  userId: string,
  moduleRoute: string,
  permission: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
): Promise<boolean> {
  const client = await ssoPool.connect()

  try {
    const result = await client.query(
      `SELECT p.codigo
       FROM sso_usuario_modulo um
       JOIN sso_modulos m ON m.id = um.modulo_id
       JOIN sso_permissoes p ON p.id = um.permissao_id
       WHERE um.usuario_id = $1
         AND m.rota = $2
         AND m.aplicacao_id = $3
         AND um.ativo = true
         AND m.ativo = true
         AND (um.data_expiracao IS NULL OR um.data_expiracao >= NOW())`,
      [userId, moduleRoute, SSO_APP_ID]
    )

    const permissoes = result.rows.map(row => row.codigo)

    // ADMIN tem acesso a tudo
    if (permissoes.includes('ADMIN')) {
      return true
    }

    return permissoes.includes(permission)
  } catch (error) {
    console.error('[SSO] Erro ao verificar permissão:', error)
    return false
  } finally {
    client.release()
  }
}

/**
 * Registra log de acesso
 */
export async function logAccess(
  userId: string,
  acao: 'LOGIN' | 'LOGOUT' | 'ACCESS' | 'CREATE' | 'UPDATE' | 'DELETE',
  ip: string,
  userAgent: string,
  sucesso: boolean = true,
  moduloId?: string,
  detalhes?: object
): Promise<void> {
  const client = await ssoPool.connect()

  try {
    await client.query(
      `INSERT INTO sso_logs_acesso 
       (usuario_id, aplicacao_id, modulo_id, acao, ip, user_agent, sucesso, detalhes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        SSO_APP_ID,
        moduloId || null,
        acao,
        ip,
        userAgent,
        sucesso,
        detalhes ? JSON.stringify(detalhes) : null,
      ]
    )
  } catch (error) {
    console.error('[SSO] Erro ao registrar log:', error)
  } finally {
    client.release()
  }
}

/**
 * Busca módulo por rota
 */
export async function getModuleByRoute(route: string): Promise<string | null> {
  const client = await ssoPool.connect()

  try {
    const result = await client.query(
      `SELECT id FROM sso_modulos
       WHERE rota = $1 AND aplicacao_id = $2 AND ativo = true`,
      [route, SSO_APP_ID]
    )

    return result.rows.length > 0 ? result.rows[0].id : null
  } catch (error) {
    console.error('[SSO] Erro ao buscar módulo:', error)
    return null
  } finally {
    client.release()
  }
}
