import { useEffect, useState } from 'react'
import { Toaster as SonnerToaster, type ToasterProps, toast } from 'sonner'

function getResolvedTheme() {
  if (typeof document === 'undefined') {
    return 'light' as const
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function Toaster(props: ToasterProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(getResolvedTheme)

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getResolvedTheme())
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'sonner-toast',
          title: 'sonner-toast-title',
          description: 'sonner-toast-description',
        },
      }}
      {...props}
    />
  )
}

export { toast }
