import { NextResponse } from 'next/server'

// Função para executar consultas no banco de dados
export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query não fornecida' }, { status: 400 })
    }

    // Importar pg dinamicamente apenas no servidor
    const { Pool } = await import('pg')

    // Conexão com banco Metabase
    const pool = new Pool({
      host: '10.0.20.61',
      port: 5432,
      database: 'metabase',
      user: 'postgres',
      password: 'CEnIg8shcyeF',
    })

    console.log('🔍 Executando consulta:', query.substring(0, 100) + '...')

    const result = await pool.query(query)
    
    await pool.end()

    console.log('✅ Consulta executada com sucesso:', result.rows.length, 'linhas')

    return NextResponse.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
    })
  } catch (error: any) {
    console.error('❌ Erro na consulta:', error.message)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao executar consulta',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
