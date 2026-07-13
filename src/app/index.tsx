import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Redirect } from 'expo-router'

import { useAuthStore } from '@/stores/auth'

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!hydrated) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/todos' : '/login'} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
