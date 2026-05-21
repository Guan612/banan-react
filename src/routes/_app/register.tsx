import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { RegisterForm } from '../../features/auth/register-form'

const registerSearchSchema = z.object({
  redirect: z.string().optional(),
  code: z.string().optional(),
})

export const Route = createFileRoute('/_app/register')({
  validateSearch: registerSearchSchema,
  component: RegisterPage,
})

function RegisterPage() {
  const search = Route.useSearch()

  return (
    <main className="auth-page-shell px-4 pb-12 pt-14">
      <div className="page-wrap auth-page-inner">
        <RegisterForm redirectTo={search.redirect} />
      </div>
    </main>
  )
}
