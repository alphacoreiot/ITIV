// Force Node.js runtime for database access
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getUserPermissions } from '@/lib/sso'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const permissions = await getUserPermissions(session.user.id)

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('[Permissions API] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar permissões' },
      { status: 500 }
    )
  }
}
