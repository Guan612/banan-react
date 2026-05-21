import { Outlet, createFileRoute } from '@tanstack/react-router'
import Header from '../components/Header'

export const Route = createFileRoute('/_canvas')({
  component: CanvasLayout,
})

function CanvasLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}
