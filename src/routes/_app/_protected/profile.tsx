import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '../../../features/profile/profile-page'

export const Route = createFileRoute('/_app/_protected/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  return <ProfilePage />
}
