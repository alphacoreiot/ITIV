import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const METABASE_SITE_URL = "http://bi.camacari.ba.gov.br"
const METABASE_SECRET_KEY = "ae9d47849fe03643c16ef79a657f6b5c63ee6c0261d2d1901174888383eb259b"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dashboardId = searchParams.get('dashboard') || '3'

  const payload = {
    resource: { dashboard: parseInt(dashboardId) },
    params: {},
    exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
  }

  const token = jwt.sign(payload, METABASE_SECRET_KEY)
  const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`

  return NextResponse.json({ iframeUrl })
}
