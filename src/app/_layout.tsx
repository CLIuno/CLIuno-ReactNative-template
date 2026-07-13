import { useEffect } from 'react'
import { Stack } from 'expo-router'

import { useAuthStore } from '@/stores/auth'

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="todos/[id]" options={{ title: 'Todo' }} />
      <Stack.Screen name="posts/[id]" options={{ title: 'Post' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'User' }} />
    </Stack>
  )
}
