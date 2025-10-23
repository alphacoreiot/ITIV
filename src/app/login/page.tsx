'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciais inválidas')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image com overlay */}
      <div className="absolute inset-0">
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover blur-sm"
          priority
          quality={100}
        />
        {/* Overlay branco com transparência para manter legibilidade */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md"></div>
      </div>

      {/* Efeitos de fundo com degradê animado em formato de brisa */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Camada 1 - Vermelho suave */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(236, 33, 42, 0.3) 0%, transparent 70%)',
            top: '-10%',
            left: '-5%',
            animation: 'float-breeze-1 18s ease-in-out infinite'
          }}
        ></div>
        
        {/* Camada 2 - Verde suave */}
        <div 
          className="absolute w-[450px] h-[450px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139, 192, 61, 0.3) 0%, transparent 70%)',
            top: '10%',
            right: '-10%',
            animation: 'float-breeze-2 22s ease-in-out infinite'
          }}
        ></div>
        
        {/* Camada 3 - Laranja suave */}
        <div 
          className="absolute w-[520px] h-[520px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(246, 132, 35, 0.3) 0%, transparent 70%)',
            bottom: '-5%',
            left: '20%',
            animation: 'float-breeze-3 20s ease-in-out infinite'
          }}
        ></div>
        
        {/* Camada 4 - Roxo suave */}
        <div 
          className="absolute w-[480px] h-[480px] rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 150, 0.3) 0%, transparent 70%)',
            bottom: '15%',
            right: '10%',
            animation: 'float-breeze-4 24s ease-in-out infinite'
          }}
        ></div>
        
        {/* Camada 5 - Mix vermelho-laranja */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(236, 33, 42, 0.2) 0%, rgba(246, 132, 35, 0.2) 50%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'float-breeze-5 26s ease-in-out infinite'
          }}
        ></div>
      </div>

      {/* Card de Login */}
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-8 md:p-12 w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center -mb-12">
          <div className="relative w-48 h-32">
            <Image
              src="/logo.png"
              alt="ITIV Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Destaque IA */}
        <div className="flex justify-center mb-8">
          <span className="text-4xl font-black bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple bg-clip-text text-transparent tracking-wide">
            I.A.
          </span>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-primary-red via-primary-orange via-primary-green to-primary-purple bg-clip-text text-transparent">
          Bem-vindo
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Faça login para continuar
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 outline-none transition-all text-gray-800 placeholder:text-gray-400"
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 outline-none transition-all text-gray-800 placeholder:text-gray-400"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-primary-red text-primary-red px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white font-semibold text-lg rounded-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Informações de teste */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Credenciais de teste: <span className="text-gray-700 font-mono font-semibold">admin / admin123</span>
          </p>
        </div>

        {/* Decorações com degradê das cores */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-primary-red to-primary-orange opacity-30 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-primary-purple to-primary-green opacity-30 rounded-full blur-2xl"></div>
      </div>
    </div>
  )
}
