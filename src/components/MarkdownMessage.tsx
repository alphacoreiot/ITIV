'use client'

interface MarkdownMessageProps {
  content: string
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  // Função para processar o markdown
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let currentIndex = 0

    lines.forEach((line, index) => {
      const key = `line-${index}`

      // Título com emoji no início (ex: 📊 **Título**)
      if (line.match(/^[📊💯🏆⚠️📉🥇👥📋💰✅❌⏳🎁📍📅🔖📈💼]\s*\*\*.*\*\*$/)) {
        const emoji = line.match(/^([📊💯🏆⚠️📉🥇👥📋💰✅❌⏳🎁📍📅🔖📈💼])/)?.[1]
        const title = line.replace(/^[📊💯🏆⚠️📉🥇👥📋💰✅❌⏳🎁📍📅🔖📈💼]\s*\*\*(.*)\*\*$/, '$1')
        elements.push(
          <div key={key} className="flex items-center gap-2 mb-3 mt-4">
            <span className="text-2xl">{emoji}</span>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
        )
        return
      }

      // Subtítulo com ** no início e final
      if (line.match(/^\*\*[^*]+\*\*:?\s*$/)) {
        const title = line.replace(/^\*\*([^*]+)\*\*:?\s*$/, '$1')
        elements.push(
          <h4 key={key} className="font-semibold text-gray-800 mt-3 mb-2">
            {title}
          </h4>
        )
        return
      }

      // Item de lista numerada com texto em negrito (ex: **1. Título**)
      if (line.match(/^\*\*\d+\.\s+[^*]+\*\*(\s+\(.+\))?$/)) {
        const match = line.match(/^\*\*(\d+)\.\s+([^*]+)\*\*(\s+\((.+)\))?$/)
        if (match) {
          const [, number, title, , extra] = match
          elements.push(
            <div key={key} className="mt-3 mb-2">
              <span className="font-bold text-primary-purple">{number}.</span>
              <span className="font-semibold text-gray-800 ml-2">{title}</span>
              {extra && <span className="text-gray-600 ml-1">({extra})</span>}
            </div>
          )
        }
        return
      }

      // Item com emoji e informação (ex:    💰 Valor: R$ 1.000,00)
      if (line.match(/^\s+[📋💰✅❌⏳🎁📍📅🔖👥📦📈]/)) {
        const indent = line.match(/^(\s+)/)?.[1].length || 0
        const processedLine = processInlineFormatting(line.trim())
        elements.push(
          <div 
            key={key} 
            className="text-sm text-gray-700"
            style={{ paddingLeft: `${indent * 4}px` }}
          >
            {processedLine}
          </div>
        )
        return
      }

      // Seção com emoji no início (ex: 💼 **ADESÕES:**)
      if (line.match(/^[💼💰📊]\s*\*\*[^*]+\*\*:?\s*$/)) {
        const emoji = line.match(/^([💼💰📊])/)?.[1]
        const title = line.replace(/^[💼💰📊]\s*\*\*([^*]+)\*\*:?\s*$/, '$1')
        elements.push(
          <div key={key} className="flex items-center gap-2 mt-3 mb-2">
            <span className="text-lg">{emoji}</span>
            <span className="font-semibold text-gray-700 text-sm uppercase">{title}</span>
          </div>
        )
        return
      }

      // Lista com bullet point
      if (line.match(/^[•-]\s+/)) {
        const processedLine = processInlineFormatting(line.replace(/^[•-]\s+/, ''))
        elements.push(
          <div key={key} className="flex gap-2 text-sm text-gray-700 ml-4">
            <span>•</span>
            <span className="flex-1">{processedLine}</span>
          </div>
        )
        return
      }

      // Opções numeradas do menu (ex: 1️⃣ IPTU - ...)
      if (line.match(/^[1-9]️⃣\s+/)) {
        elements.push(
          <div key={key} className="my-2 font-medium text-gray-800">
            {line}
          </div>
        )
        return
      }

      // Linha vazia
      if (line.trim() === '') {
        elements.push(<div key={key} className="h-2" />)
        return
      }

      // Linha comum com formatação inline
      const processedLine = processInlineFormatting(line)
      elements.push(
        <div key={key} className="text-sm text-gray-700">
          {processedLine}
        </div>
      )
    })

    return elements
  }

  // Processar formatação inline (negrito, valores, etc)
  const processInlineFormatting = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let currentText = text
    let key = 0

    // Regex para encontrar padrões
    const patterns = [
      // Negrito **texto**
      { regex: /\*\*([^*]+)\*\*/g, render: (match: string) => 
        <strong key={`bold-${key++}`} className="font-semibold text-gray-900">{match}</strong> 
      },
      // Valores monetários R$ X,XX
      { regex: /(R\$\s*[\d.,]+)/g, render: (match: string) => 
        <span key={`money-${key++}`} className="font-semibold text-green-600">{match}</span> 
      },
      // Percentuais X%
      { regex: /(\d+[.,]?\d*%)/g, render: (match: string) => 
        <span key={`percent-${key++}`} className="font-semibold text-blue-600">{match}</span> 
      },
    ]

    let result: React.ReactNode[] = [currentText]

    patterns.forEach(({ regex, render }) => {
      const newResult: React.ReactNode[] = []
      
      result.forEach((item) => {
        if (typeof item === 'string') {
          const parts = item.split(regex)
          parts.forEach((part, index) => {
            if (regex.test(part)) {
              newResult.push(render(part.replace(/\*\*/g, '')))
            } else if (part) {
              newResult.push(part)
            }
          })
        } else {
          newResult.push(item)
        }
      })
      
      result = newResult
    })

    return result
  }

  return (
    <div className="space-y-1">
      {renderMarkdown(content)}
    </div>
  )
}
