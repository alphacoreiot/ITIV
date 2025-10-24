import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY
    
    console.log('🌤️ Buscando clima... API Key presente?', !!apiKey)
    
    if (!apiKey) {
      throw new Error('API Key não configurada')
    }
    
    // Coordenadas de Camaçari, BA
    const lat = -12.6997
    const lon = -38.3243
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${apiKey}`
    
    console.log('🌤️ Chamando OpenWeather API...')
    
    const response = await fetch(url, {
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na resposta da API:', response.status, errorText)
      throw new Error(`Erro ao buscar dados do clima: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('✅ Clima obtido com sucesso:', data.name, data.main.temp + '°C')
    
    return NextResponse.json({
      temperatura: Math.round(data.main.temp),
      sensacao: Math.round(data.main.feels_like),
      descricao: data.weather[0].description,
      umidade: data.main.humidity,
      cidade: data.name,
      icone: data.weather[0].icon
    })
  } catch (error) {
    console.error('❌ Erro ao buscar clima:', error)
    
    // Retornar dados mockados em caso de erro
    return NextResponse.json({
      temperatura: 28,
      sensacao: 30,
      descricao: 'ensolarado',
      umidade: 75,
      cidade: 'Camaçari',
      icone: '01d',
      mock: true
    })
  }
}
