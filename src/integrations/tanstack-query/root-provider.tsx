import { QueryClient } from '@tanstack/react-query'

let browserQueryClient: QueryClient | undefined

export function getContext() {
  browserQueryClient ??= new QueryClient()

  return {
    queryClient: browserQueryClient,
  }
}
export default function TanstackQueryProvider() {}
