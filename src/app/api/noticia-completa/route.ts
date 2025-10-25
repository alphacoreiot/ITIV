import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

type FeedKey = 'bahia' | 'agencia'

const FEEDS: Record<FeedKey, { url: string }> = {
  bahia: { url: 'https://www.ba.gov.br/comunicacao/feed' },
  agencia: { url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml' }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const fonteParam = searchParams.get('fonte')
  const preferedOrder: FeedKey[] = buildFeedOrder(fonteParam)

  if (!url) {
    return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })
  }

  try {
    const feedContent = await fetchFeedItem(url, preferedOrder)
    if (feedContent) {
      return NextResponse.json(feedContent)
    }

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
    const parsed = parseHtmlContent(html)

    return NextResponse.json({
      ...parsed,
      url,
      source: preferedOrder[0] ?? 'externo'
    })
  } catch (error) {
    console.error('Erro ao buscar conteúdo da notícia:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar notícia' },
      { status: 500 }
    )
  }
}

async function fetchFeedItem(targetUrl: string, feedOrder: FeedKey[]) {
  const normalizedTarget = normalizeUrl(targetUrl)

  for (const feedKey of feedOrder) {
    const feedConfig = FEEDS[feedKey]
    if (!feedConfig) continue

    try {
      const response = await fetch(feedConfig.url, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        continue
      }

      const xml = await response.text()
      const $ = cheerio.load(xml, { xmlMode: true })
      let matchedContent: { title: string; date: string; content: string; url: string; source: string } | null = null

      $('item').each((_index, element) => {
        if (matchedContent) return false

        const $item = $(element)
        const link = normalizeUrl($item.find('link').first().text().trim())
        if (!link) return

        if (link === normalizedTarget || link === normalizedTarget.replace(/\/$/, '')) {
          const title = $item.find('title').first().text().trim()
          const pubDate = $item.find('pubDate').first().text().trim()
          const contentEncoded = $item.find('content\\:encoded').first().text().trim()
          const descriptionHtml = $item.find('description').first().text().trim()

          let content = contentEncoded || descriptionHtml || ''
          if (content) {
            const cleaned = sanitizeHtml(content)
            let date = new Date().toLocaleDateString('pt-BR')
            if (pubDate) {
              const parsedDate = new Date(pubDate)
              if (!Number.isNaN(parsedDate.getTime())) {
                date = parsedDate.toLocaleDateString('pt-BR')
              }
            }

            matchedContent = {
              title,
              date,
              content: cleaned,
              url: link,
              source: feedKey
            }
          }
        }
      })

      if (matchedContent) {
        return matchedContent
      }
    } catch (error) {
      console.error(`Erro ao buscar feed ${feedKey} para notícia completa:`, error)
    }
  }

  return null
}

function parseHtmlContent(html: string) {
  const $ = cheerio.load(html)
  const title = $('h1, .entry-title').first().text().trim()
  const dateText = $('time, .entry-date, .post-date').first().text().trim()
  const contentNode = $('article .entry-content, article .post-content, article .content, main article, .article-content').first()
  let content = contentNode.html() || $('article').first().html() || ''

  const cleaned = sanitizeHtml(content)
  const date = dateText || new Date().toLocaleDateString('pt-BR')

  return {
    title,
    date,
    content: cleaned
  }
}

function sanitizeHtml(rawHtml: string) {
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on[a-z]+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}

function normalizeUrl(link: string) {
  return link.replace(/\/?$/,'').trim()
}

function buildFeedOrder(fonteParam: string | null): FeedKey[] {
  const validKeys: FeedKey[] = ['bahia', 'agencia']

  if (fonteParam && validKeys.includes(fonteParam as FeedKey)) {
    const preferred = fonteParam as FeedKey
    return [preferred, ...validKeys.filter(key => key !== preferred)]
  }

  return validKeys
}
