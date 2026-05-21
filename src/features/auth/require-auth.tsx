import { Navigate } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import type { ReactNode } from 'react'
import { accessTokenAtom } from '../../lib/auth'
import { getCurrentRelativeUrl } from './auth-redirect'

export function RequireAuth({
  children,
}: {
  children: ReactNode
}) {
  const accessToken = useAtomValue(accessTokenAtom)

  if (accessToken) {
    return <>{children}</>
  }

  return (
    <Navigate
      to="/login"
      search={{ redirect: getCurrentRelativeUrl() }}
      replace
    />
  )
}
