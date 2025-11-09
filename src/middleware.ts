// Force Node.js runtime to enable pg and crypto modules
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Pool } from 'pg'

const ssoPool = new Pool({
  host: '10.0.20.61',
  port: 5432,
  database: 'metabase',
  user: 'postgres',
  password: 'CEnIg8shcyeF',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const APP_ID = 'ac86e8c4-32f6-4103-b544-12836864fc43'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  // Se não estiver autenticado, redireciona para login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const userId = token.id as string
  const pathname = request.nextUrl.pathname

  // Mapeia rotas para caminhos de módulo
  const moduleMap: Record<string, string> = {
    '/dashboard': '/dashboard',
    '/bi-refis': '/bi-refis',
    '/bi-iptu': '/bi-iptu',
    '/bi-tff': '/bi-tff',
    '/bi-refis-percentuais': '/bi-refis-percentuais',
    '/noticia': '/noticia',
  }

  // Encontra o módulo baseado na rota
  let modulePath = ''
  for (const [route, path] of Object.entries(moduleMap)) {
    if (pathname.startsWith(route)) {
      modulePath = path
      break
    }
  }

  if (!modulePath) {
    return NextResponse.next()
  }

  try {
    // Verifica permissão do usuário no módulo
    const result = await ssoPool.query(
      `SELECT um.permissoes 
       FROM sso_usuario_modulo um
       INNER JOIN sso_modulos m ON um.modulo_id = m.modulo_id
       WHERE um.usuario_id = $1 
       AND m.caminho = $2 
       AND m.aplicacao_id = $3
       AND m.ativo = true`,
      [userId, modulePath, APP_ID]
    )

    // Se não tem permissão, retorna 403
    if (result.rows.length === 0) {
      console.log(`Acesso negado: ${token.email} não tem permissão para ${modulePath}`)
      return new NextResponse(
        JSON.stringify({ error: 'Acesso negado a este módulo' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    }

    // Registra acesso no log
    await ssoPool.query(
      `INSERT INTO sso_logs_acesso (usuario_id, acao, detalhes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'ACCESS',
        JSON.stringify({ module: modulePath, path: pathname }),
        request.ip || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      ]
    )

    return NextResponse.next()
  } catch (error) {
    console.error('Erro ao verificar permissões:', error)
    return NextResponse.next() // Permite acesso em caso de erro para não bloquear completamente
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bi-refis/:path*',
    '/bi-iptu/:path*',
    '/bi-tff/:path*',
    '/bi-refis-percentuais/:path*',
    '/noticia/:path*',
  ],
}
