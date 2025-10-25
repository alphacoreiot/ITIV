import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import type { FonteNoticias, NoticiaItem, NoticiasResponse } from '@/types/dashboard'

type FeedKey = FonteNoticias

const FEEDS: Record<FeedKey, {
  url: string
  fallbackTitle: string
  fallbackUrl: string
  baseImageUrl?: string
}> = {
  bahia: {
    url: 'https://www.ba.gov.br/comunicacao/feed',
    fallbackTitle: 'Governo da Bahia - Notícias Oficiais',
    fallbackUrl: 'https://www.ba.gov.br/comunicacao/noticias',
    baseImageUrl: 'https://www.ba.gov.br'
  },
  agencia: {
    url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml',
    fallbackTitle: 'Agência Brasil - Economia',
    fallbackUrl: 'https://agenciabrasil.ebc.com.br/economia'
  }
}

export async function GET() {
  const [bahiaNoticias, agenciaNoticias] = await Promise.all([
    loadFeed('bahia'),
    loadFeed('agencia')
  ])

  return NextResponse.json<NoticiasResponse>({
    noticias: {
      bahia: bahiaNoticias,
      agencia: agenciaNoticias
    }
  })
}

async function loadFeed(feedKey: FeedKey): Promise<NoticiaItem[]> {
  const config = FEEDS[feedKey]
  try {
    const response = await fetch(config.url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar feed ${feedKey}`)
    }

    const xml = await response.text()
    const $ = cheerio.load(xml, { xmlMode: true })
    const noticias: NoticiaItem[] = []

    const entries = $('item').length ? $('item') : $('entry')

    entries.each((_index, element) => {
      if (noticias.length >= 9) return false

      const $item = $(element)
      const title = getFirstText($item, ['title'])
      const url = getFirstLink($item) || getFirstText($item, ['guid'])
      const descriptionHtml = getFirstText($item, ['description', 'content\:encoded', 'content', 'summary'])

      let descriptionText = ''
      if (descriptionHtml) {
        const descriptionDom = cheerio.load(descriptionHtml)
        descriptionText = descriptionDom.root().text().replace(/\s+/g, ' ').trim()
      }
      const excerpt = descriptionText.substring(0, 200) + (descriptionText.length > 200 ? '...' : '')

      const pubDate = getFirstText($item, ['pubDate', 'updated', 'published'])
      let date = new Date().toLocaleDateString('pt-BR')
      if (pubDate) {
        const parsedDate = new Date(pubDate)
        if (!Number.isNaN(parsedDate.getTime())) {
          date = parsedDate.toLocaleDateString('pt-BR')
        }
      }

      const image = resolveImageUrl($item, descriptionHtml, config.baseImageUrl)

      if (title && url) {
        noticias.push({
          id: noticias.length + 1,
          title,
          excerpt: excerpt || 'Clique para ler mais...',
          url,
          date,
          image,
          source: feedKey
        })
      }
    })

    if (noticias.length === 0) {
      return [buildFallback(feedKey)]
    }

    return noticias
  } catch (error) {
    console.error(`Erro ao carregar feed ${feedKey}:`, error)
    return [buildFallback(feedKey)]
  }
}

function getFirstText($context: cheerio.Cheerio, selectors: string[]): string {
  for (const selector of selectors) {
    const text = $context.find(selector).first().text().trim()
    if (text) return text
  }
  return ''
}

function getFirstLink($context: cheerio.Cheerio): string {
  const links = $context.find('link')
  for (let i = 0; i < links.length; i += 1) {
    const link = links.eq(i)
    const rel = (link.attr('rel') || '').toLowerCase()
    if (rel && rel !== 'alternate') continue

    const href = link.attr('href')?.trim()
    if (href) return href

    const text = link.text().trim()
    if (text) return text
  }

  return ''
}

function resolveImageUrl($item: cheerio.Cheerio, descriptionHtml: string, baseImageUrl?: string) {
  let image = '/logo.png'

  const enclosureUrl = $item.find('enclosure').attr('url')?.trim()
  if (enclosureUrl) {
    image = enclosureUrl
  }

  if (image === '/logo.png') {
    const mediaContent = $item.find('media\\:content').attr('url')?.trim()
    const mediaThumb = mediaContent ||
      $item.find('media\\:thumbnail').attr('url')?.trim() ||
      $item.find('link[rel="enclosure"][type^="image/"]').attr('href')?.trim()
    if (mediaThumb) {
      image = mediaThumb
    }
  }

  if (image === '/logo.png' && descriptionHtml) {
    const $desc = cheerio.load(descriptionHtml)
    const firstImg = $desc('img').first().attr('src')
    if (firstImg) {
      image = firstImg
    }
  }

  if (image && !image.startsWith('http') && baseImageUrl) {
    image = `${baseImageUrl}${image.startsWith('/') ? '' : '/'}${image}`
  }

  return image
}

function buildFallback(feedKey: FeedKey): NoticiaItem {
  const config = FEEDS[feedKey]
  return {
    id: 1,
    title: config.fallbackTitle,
    excerpt: 'Conteúdo temporariamente indisponível. Acesse o portal oficial para mais informações.',
    url: config.fallbackUrl,
    date: new Date().toLocaleDateString('pt-BR'),
    image: '/logo.png',
    source: feedKey
  }
}
