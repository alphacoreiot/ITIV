import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET() {
  try {
    // Buscar a página de notícias
    const response = await fetch('https://sefaz.camacari.ba.gov.br/', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error('Erro ao buscar notícias')
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const noticias: any[] = []
    
    // Tentar diferentes seletores comuns do WordPress
    const selectors = [
      'article.post',
      'article.hentry', 
      '.post',
      '.entry',
      'article'
    ]
    
    for (const selector of selectors) {
      $(selector).each((_index: number, element: any) => {
        if (noticias.length >= 9) return false // Limitar a 9 notícias
        
        const $article = $(element)
        
        // Tentar encontrar título
        const $title = $article.find('h2.entry-title a, h3.entry-title a, h2 a, h3 a, .entry-title a, a.post-title').first()
        const title = $title.text().trim()
        const url = $title.attr('href') || ''
        
        // Tentar encontrar resumo
        const $excerpt = $article.find('.entry-summary, .entry-content, .post-excerpt, p').first()
        let excerpt = $excerpt.text().trim()
        if (excerpt.length > 200) {
          excerpt = excerpt.substring(0, 200) + '...'
        }
        
        // Tentar encontrar data
        const $date = $article.find('time, .entry-date, .post-date').first()
        const dateStr = $date.attr('datetime') || $date.text().trim()
        let date = ''
        try {
          date = dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : ''
        } catch {
          date = dateStr
        }
        
        // Tentar encontrar imagem - múltiplas tentativas
        let image = '/logo.png'
        
        // 1. Procurar img dentro do article
        const $img = $article.find('img').first()
        if ($img.length) {
          image = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src') || image
        }
        
        // 2. Procurar na thumbnail/featured image
        const $thumb = $article.find('.post-thumbnail img, .entry-image img, .featured-image img').first()
        if ($thumb.length && image === '/logo.png') {
          image = $thumb.attr('src') || $thumb.attr('data-src') || image
        }
        
        // 3. Procurar no background-image do CSS
        if (image === '/logo.png') {
          const $bgDiv = $article.find('[style*="background-image"]').first()
          if ($bgDiv.length) {
            const style = $bgDiv.attr('style') || ''
            const bgMatch = style.match(/url\(['"]?([^'"()]+)['"]?\)/)
            if (bgMatch) {
              image = bgMatch[1]
            }
          }
        }
        
        // 4. Se a imagem for relativa, tornar absoluta
        if (image && !image.startsWith('http') && !image.startsWith('/logo.png')) {
          image = `https://sefaz.camacari.ba.gov.br${image.startsWith('/') ? '' : '/'}${image}`
        }
        
        if (title && url) {
          noticias.push({
            id: noticias.length + 1,
            title,
            excerpt: excerpt || 'Clique para ler mais...',
            url,
            date: date || new Date().toLocaleDateString('pt-BR'),
            image
          })
        }
      })
      
      if (noticias.length >= 9) break
    }

    // Se não conseguiu fazer scraping, retornar notícias de exemplo
    if (noticias.length === 0) {
      return NextResponse.json({
        noticias: [
          {
            id: 1,
            title: 'Parceria para Inovação: SEFAZ + SENAI CIMATEC',
            excerpt: 'A SEFAZ Camaçari firma parceria estratégica com o SENAI CIMATEC para fomentar inovação e tecnologia na gestão pública.',
            url: 'https://sefaz.camacari.ba.gov.br/parceria-para-inovacao-sefaz-senai-cimatec/',
            date: new Date().toLocaleDateString('pt-BR'),
            image: '/logo.png'
          },
          {
            id: 2,
            title: 'Modernização da Gestão Tributária',
            excerpt: 'Sistema integrado de gestão tributária traz mais eficiência e transparência para o município.',
            url: 'https://sefaz.camacari.ba.gov.br/',
            date: new Date().toLocaleDateString('pt-BR'),
            image: '/logo.png'
          },
          {
            id: 3,
            title: 'Atendimento Digital SEFAZ',
            excerpt: 'Novos canais digitais facilitam acesso aos serviços da Secretaria de Fazenda.',
            url: 'https://sefaz.camacari.ba.gov.br/',
            date: new Date().toLocaleDateString('pt-BR'),
            image: '/logo.png'
          }
        ]
      })
    }

    return NextResponse.json({ noticias })
  } catch (error) {
    console.error('Erro ao buscar notícias:', error)
    
    // Retornar notícias padrão em caso de erro
    return NextResponse.json({
      noticias: [
        {
          id: 1,
          title: 'Parceria para Inovação: SEFAZ + SENAI CIMATEC',
          excerpt: 'A SEFAZ Camaçari firma parceria estratégica com o SENAI CIMATEC para fomentar inovação e tecnologia na gestão pública.',
          url: 'https://sefaz.camacari.ba.gov.br/parceria-para-inovacao-sefaz-senai-cimatec/',
          date: new Date().toLocaleDateString('pt-BR'),
          image: '/logo.png'
        },
        {
          id: 2,
          title: 'Modernização da Gestão Tributária',
          excerpt: 'Sistema integrado de gestão tributária traz mais eficiência e transparência para o município.',
          url: 'https://sefaz.camacari.ba.gov.br/',
          date: new Date().toLocaleDateString('pt-BR'),
          image: '/logo.png'
        },
        {
          id: 3,
          title: 'Atendimento Digital SEFAZ',
          excerpt: 'Novos canais digitais facilitam acesso aos serviços da Secretaria de Fazenda.',
          url: 'https://sefaz.camacari.ba.gov.br/',
          date: new Date().toLocaleDateString('pt-BR'),
          image: '/logo.png'
        }
      ]
    })
  }
}
