'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Especialista em Gestão Tributária à disposição. Consulte dados de TFF e IPTU para tomada de decisão.'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Adicionar mensagem de processamento imediatamente
    const thinkingMsg: Message = {
      role: 'assistant',
      content: '🔍 Analisando sua pergunta...'
    }
    setMessages(prev => [...prev, thinkingMsg])

    // Timeout de 60 segundos
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg?.content?.includes('🔍')) {
          return [...prev.slice(0, -1), {
            role: 'assistant',
            content: '⏱️ A consulta está demorando mais que o esperado. Tente novamente ou simplifique a pergunta.'
          }]
        }
        return prev
      })
    }, 60000)

    try {
      console.log('📤 Enviando pergunta:', userMessage.content)
      
      // Chamada única: o backend faz todo o trabalho
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📥 Resposta recebida')

      if (data.error) {
        throw new Error(data.error)
      }

      // Remover mensagem de "analisando"
      setMessages(prev => prev.slice(0, -1))

      // Adicionar resposta final
      setMessages(prev => [...prev, data.message])
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error)
      console.error('📋 Detalhes:', error.message)
      
      // Remover mensagem de processamento
      setMessages(prev => prev.slice(0, -1))
      
      // Mostrar erro amigável
      const errorMsg = error.message || 'Erro desconhecido'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Desculpe, não consegui processar sua pergunta.\n\n${errorMsg.includes('HTTP') ? 'Erro de conexão com o servidor.' : errorMsg}\n\nPor favor, tente novamente.`
      }])
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
          aria-label="Abrir chatbot"
        >
          <svg 
            className="w-8 h-8 text-white group-hover:scale-110 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
            />
          </svg>
        </button>
      )}

      {/* Janela do Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-white font-bold">Especialista Tributário</h3>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              aria-label="Fechar chatbot"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
