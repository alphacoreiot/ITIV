'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'

interface AppHeaderProps {
  session: Session
  mode: 'dashboard' | 'bi'
  onBiAction: () => void
  biActionActive?: boolean
  biTitle?: string
  onLogoClick?: () => void
}

export default function AppHeader({
  session,
  mode,
  onBiAction,
  biActionActive = false,
  biTitle,
  onLogoClick
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const resolvedBiTitle = biTitle ?? 'Painel B.I.'
  const navLabel = mode === 'dashboard' ? 'Painéis do B.I.' : 'Voltar ao dashboard'
  const navIcon = mode === 'dashboard' ? '📊' : '🏠'

  const handleNavAction = () => {
    onBiAction()
    setMobileMenuOpen(false)
  }

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick()
    }
  }

  const navButtonActive = mode === 'dashboard' ? biActionActive : false
  const navButtonClasses = navButtonActive
    ? 'bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white shadow-lg scale-105'
    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-primary-red/10 hover:via-primary-orange/10 hover:to-primary-purple/10 hover:text-gray-900 hover:scale-105 border border-gray-200'

  return (
    <header className="bg-gradient-to-br from-white via-gray-50 to-white backdrop-blur-xl border-2 border-gray-200 shadow-2xl m-3 md:m-4 p-4 md:p-6 rounded-3xl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8">
          <div
            className={`relative w-auto h-16 md:h-18 ${onLogoClick ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-500 ease-out' : ''}`}
            onClick={handleLogoClick}
          >
            <Image
              src="/logo.png"
              alt="SMART SEFAZ Logo"
              width={135}
              height={64}
              className="object-contain h-16 md:h-18 w-auto"
              priority
            />
          </div>

          <nav className="hidden md:flex items-center gap-3">
            <button
              onClick={handleNavAction}
              className={`flex items-center gap-2 px-4 lg:px-6 py-3 text-sm lg:text-base font-semibold transition-all duration-300 rounded-xl shadow-md ${navButtonClasses}`}
            >
              <span className="text-xl lg:text-2xl">{navIcon}</span>
              <span>{navLabel}</span>
            </button>
            {mode === 'bi' && (
              <div className="px-4 py-2 bg-gradient-to-r from-primary-purple/10 to-primary-red/10 rounded-xl border border-primary-purple/30">
                <span className="text-sm lg:text-base font-bold bg-gradient-to-r from-primary-purple via-primary-red to-primary-orange bg-clip-text text-transparent whitespace-nowrap">
                  {resolvedBiTitle}
                </span>
              </div>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-2 text-gray-700 hover:bg-gradient-to-r hover:from-primary-red/10 hover:to-primary-orange/10 rounded-xl transition-all duration-300 border border-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4 lg:gap-5">
          <div className="text-right px-4 py-2 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
            <p className="text-gray-900 font-bold text-sm lg:text-base">{session.user?.name}</p>
            <p className="text-gray-600 text-xs lg:text-sm">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-5 lg:px-6 py-3 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white font-bold rounded-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
          >
            🚪 Sair
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t-2 border-gray-200">
          <nav className="space-y-3">
            <button
              onClick={handleNavAction}
              className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-semibold transition-all duration-300 rounded-xl ${navButtonActive ? 'bg-gradient-to-r from-primary-red/20 via-primary-orange/20 to-primary-purple/20 text-gray-900 border-l-4 border-primary-orange shadow-md' : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-primary-red/10 hover:to-primary-orange/10 border border-gray-200'}`}
            >
              <span className="text-xl">{navIcon}</span>
              <span>{navLabel}</span>
            </button>
            {mode === 'bi' && (
              <div className="px-4 py-3 bg-gradient-to-r from-primary-purple/10 to-primary-red/10 rounded-xl border border-primary-purple/30">
                <p className="text-sm font-bold bg-gradient-to-r from-primary-purple via-primary-red to-primary-orange bg-clip-text text-transparent">
                  {resolvedBiTitle}
                </p>
              </div>
            )}
          </nav>

          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <div className="mb-4 p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
              <p className="text-gray-900 font-bold text-sm">{session.user?.name}</p>
              <p className="text-gray-600 text-xs">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white font-bold rounded-xl hover:shadow-2xl active:scale-95 transition-all duration-300 shadow-lg"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
