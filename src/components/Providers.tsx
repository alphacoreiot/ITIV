'use client'

import { SessionProvider } from 'next-auth/react'
import PermissionGuard from './PermissionGuard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PermissionGuard>{children}</PermissionGuard>
    </SessionProvider>
  )
}
