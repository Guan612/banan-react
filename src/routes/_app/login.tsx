import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginForm } from '../../features/auth/login-form'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  code: z.string().optional(),
})

export const Route = createFileRoute('/_app/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()

  return (
    <main className="auth-page-shell px-4 pb-12 pt-14">
      <div className="page-wrap auth-page-inner">
        <LoginForm redirectTo={search.redirect} />
      </div>
    </main>
  )
}
