import { Outlet, createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '../../features/auth/require-auth'

export const Route = createFileRoute('/_canvas/_protected')({
  component: CanvasProtectedLayout,
})

function CanvasProtectedLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  )
}
