import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getIPTUMenu, executeIPTUQuery, IPTU_OPTIONS } from '@/agents/iptu-agent'
import { getREFISMenu, executeREFISQuery, REFIS_OPTIONS } from '@/agents/refis-agent'
import { getTFFMenu, executeTFFQuery, TFF_OPTIONS } from '@/agents/tff-agent'
import { getRefisPercentualMenu, executeRefisPercentualQuery, REFIS_PERCENTUAL_OPTIONS } from '@/agents/refis-percentual-agent'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: '10.0.20.61',
      port: 5432,
      database: 'metabase',
      user: 'postgres',
      password: 'CEnIg8shcyeF',
    })
  }
  return pool
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatState {
  currentAgent?: 'iptu' | 'refis' | 'tff' | 'refis_percentual'
  step: 'menu_principal' | 'menu_agente' | 'executando'
}

function getMainMenu(): string {
  return `Bem-vindo ao Sistema de Análise Tributária de Camaçari!

Escolha um tributo:

1. IPTU - Imposto Predial + COSIP + TRSD
2. REFIS - Programa de Recuperação Fiscal 2025
3. TFF - Taxa de Fiscalização de Funcionamento
4. REFIS - Percentual de Entrada

Digite o número da opção (1, 2, 3 ou 4)`
}

function parseUserInput(input: string, state: ChatState): { action: string; value?: string } {
  const inputLower = input.toLowerCase().trim()
  
  // Opção 0 sempre volta ao menu principal
  if (inputLower === '0' || inputLower === 'voltar' || inputLower === 'menu' || inputLower === 'inicio') {
    return { action: 'menu_principal' }
  }

  if (state.step === 'menu_principal') {
    if (inputLower === '1' || inputLower.includes('iptu')) {
      return { action: 'select_agent', value: 'iptu' }
    }
    if (inputLower === '2' || inputLower.includes('refis') && !inputLower.includes('percentual')) {
      return { action: 'select_agent', value: 'refis' }
    }
    if (inputLower === '3' || inputLower.includes('tff')) {
      return { action: 'select_agent', value: 'tff' }
    }
    if (inputLower === '4' || (inputLower.includes('refis') && inputLower.includes('percentual')) || inputLower.includes('entrada')) {
      return { action: 'select_agent', value: 'refis_percentual' }
    }
    return { action: 'invalid' }
  }

  if (state.step === 'menu_agente' && state.currentAgent) {
    const num = parseInt(inputLower)
    
    if (!isNaN(num)) {
      const options = state.currentAgent === 'iptu' ? IPTU_OPTIONS :
                     state.currentAgent === 'refis' ? REFIS_OPTIONS :
                     state.currentAgent === 'tff' ? TFF_OPTIONS :
                     REFIS_PERCENTUAL_OPTIONS
      
      const optionKeys = Object.keys(options)
      if (num >= 1 && num <= optionKeys.length) {
        return { action: 'execute_query', value: optionKeys[num - 1] }
      }
    }
    
    return { action: 'invalid' }
  }

  return { action: 'invalid' }
}

export async function POST(request: Request) {
  try {
    const { messages, state } = await request.json() as {
      messages: ChatMessage[]
      state?: ChatState
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }

    const currentState: ChatState = state || { step: 'menu_principal' }
    const { action, value } = parseUserInput(lastMessage.content, currentState)

    let response: string
    let newState: ChatState

    switch (action) {
      case 'menu_principal':
        response = getMainMenu()
        newState = { step: 'menu_principal' }
        break

      case 'select_agent':
        const agent = value as 'iptu' | 'refis' | 'tff' | 'refis_percentual'
        response = agent === 'iptu' ? getIPTUMenu() :
                   agent === 'refis' ? getREFISMenu() :
                   agent === 'tff' ? getTFFMenu() :
                   getRefisPercentualMenu()
        newState = { step: 'menu_agente', currentAgent: agent }
        break

      case 'execute_query':
        if (!currentState.currentAgent || !value) {
          response = 'Erro: agente não selecionado.'
          newState = { step: 'menu_principal' }
          break
        }

        try {
          const dbPool = getPool()
          
          response = currentState.currentAgent === 'iptu' 
            ? await executeIPTUQuery(value, dbPool)
            : currentState.currentAgent === 'refis'
            ? await executeREFISQuery(value, dbPool)
            : currentState.currentAgent === 'tff'
            ? await executeTFFQuery(value, dbPool)
            : await executeRefisPercentualQuery(value, dbPool)
          
          response += '\n\n0. Voltar ao menu principal\n\nDigite um número para escolher:'
          
          newState = { ...currentState, step: 'menu_agente' }
        } catch (error: any) {
          response = `Erro: ${error.message}\n\nDigite "voltar" para o menu principal.`
          newState = currentState
        }
        break

      case 'invalid':
      default:
        if (currentState.step === 'menu_principal') {
          response = 'Opção inválida! Digite 1, 2, 3 ou 4.\n\n' + getMainMenu()
        } else if (currentState.step === 'menu_agente') {
          const agentMenu = currentState.currentAgent === 'iptu' ? getIPTUMenu() :
                           currentState.currentAgent === 'refis' ? getREFISMenu() :
                           currentState.currentAgent === 'tff' ? getTFFMenu() :
                           getRefisPercentualMenu()
          response = `Opção inválida!\n\n${agentMenu}`
        } else {
          response = 'Erro. Voltando ao menu principal.\n\n' + getMainMenu()
          currentState.step = 'menu_principal'
        }
        newState = currentState
        break
    }

    return NextResponse.json({
      message: { role: 'assistant', content: response },
      state: newState
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao processar mensagem',
      message: { role: 'assistant', content: 'Erro. Digite "menu" para voltar ao início.' }
    }, { status: 500 })
  }
}