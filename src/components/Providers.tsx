'use client'

import { SessionProvider } from 'next-auth/react'
import PermissionGuard from './PermissionGuard'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SessionProvider>
      {mounted ? (
        <PermissionGuard>{children}</PermissionGuard>
      ) : (
        <>{children}</>
      )}
    </SessionProvider>
  )
}
