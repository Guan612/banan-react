import { createFileRoute } from '@tanstack/react-router'
import { useProfile } from '../../features/auth/use-profile'
import { PublicHome } from '../../features/home/public-home'
import { UserHome } from '../../features/home/user-home'

export const Route = createFileRoute('/_app/')({
  component: HomeRoute,
})

function HomeRoute() {
  const profile = useProfile()

  if (profile.isPending) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <section className="island-shell rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Loading your workspace...
          </p>
        </section>
      </main>
    )
  }

  return profile.data ? <UserHome profile={profile.data} /> : <PublicHome />
}
