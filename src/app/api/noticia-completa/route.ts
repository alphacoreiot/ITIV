import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar notícia')
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Tentar encontrar o conteúdo principal
    const $content = $('article .entry-content, .post-content, .content, main article')
    
    let title = $('h1.entry-title, h1.post-title, article h1').first().text().trim()
    let date = $('time, .entry-date, .post-date').first().text().trim()
    let content = $content.html() || ''
    
    // Limpar scripts e estilos
    content = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    
    return NextResponse.json({
      title,
      date,
      content,
      url
    })
  } catch (error) {
    console.error('Erro ao buscar conteúdo da notícia:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar notícia' },
      { status: 500 }
    )
  }
}
