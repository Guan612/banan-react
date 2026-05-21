import type { UserProfile } from '../../lib/auth-types'
import { HomePage } from './home-page'

export function UserHome({ profile }: { profile: UserProfile }) {
  return <HomePage profile={profile} />
}
