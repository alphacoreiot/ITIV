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
  const navIcon = mode === 'dashboard' ? '📊' : '⬅️'

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
    ? 'bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white shadow'
    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'

  return (
    <header className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg m-3 md:m-4 p-3 md:p-6 rounded-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8">
          <div
            className={`relative w-auto h-16 md:h-18 ${onLogoClick ? 'cursor-pointer' : ''}`}
            onClick={handleLogoClick}
          >
            <Image
              src="/logo.png"
              alt="ITIV Logo"
              width={135}
              height={64}
              className="object-contain h-16 md:h-18 w-auto"
              priority
            />
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={handleNavAction}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 text-sm lg:text-base font-medium transition-all rounded-lg ${navButtonClasses}`}
            >
              <span className="text-base lg:text-lg">{navIcon}</span>
              <span>{navLabel}</span>
            </button>
            {mode === 'bi' && (
              <span className="text-sm lg:text-base font-semibold text-gray-700 whitespace-nowrap">
                {resolvedBiTitle}
              </span>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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

        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <div className="text-right">
            <p className="text-gray-800 font-medium text-sm lg:text-base">{session.user?.name}</p>
            <p className="text-gray-600 text-xs lg:text-sm">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-3 lg:px-4 py-2 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white font-semibold rounded-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Sair
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
          <nav className="space-y-2">
            <button
              onClick={handleNavAction}
              className={`w-full flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all rounded-lg ${navButtonActive ? 'bg-gradient-to-r from-primary-red/10 via-primary-orange/10 to-primary-purple/10 text-gray-900 border-l-4 border-primary-orange' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span className="text-base">{navIcon}</span>
              <span>{navLabel}</span>
            </button>
            {mode === 'bi' && (
              <p className="text-xs text-gray-600 px-3">{resolvedBiTitle}</p>
            )}
          </nav>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="mb-3">
              <p className="text-gray-800 font-medium text-sm">{session.user?.name}</p>
              <p className="text-gray-600 text-xs">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full px-3 py-2 bg-gradient-to-r from-primary-red via-primary-orange to-primary-purple text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
