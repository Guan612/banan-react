import { Outlet, createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '../../features/auth/require-auth'

export const Route = createFileRoute('/_app/_protected')({
  component: AppProtectedLayout,
})

function AppProtectedLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  )
}
