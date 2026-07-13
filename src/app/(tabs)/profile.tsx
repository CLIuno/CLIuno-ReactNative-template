import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import axios from 'axios'

import api from '@/apis'
import { useAuthStore } from '@/stores/auth'

const colors = {
  primary: '#2563eb',
  danger: '#dc2626',
  text: '#111827',
  muted: '#6b7280',
  card: '#ffffff',
  bg: '#f3f4f6',
}

interface Post {
  id: string | number
  title: string
  content?: string | null
}

function errMsg(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message || err.message
  return err instanceof Error ? err.message : 'Something went wrong'
}

export default function ProfileScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser)
  const logout = useAuthStore((s) => s.logout)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  const load = useCallback(async () => {
    try {
      const res = await api.post.getCurrentUserPosts()
      setPosts(res.data.data.posts ?? [])
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchCurrentUser()
    load()
  }

  const onLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const header = (
    <View>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>
          {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
        </Text>
        {!!user?.username && <Text style={styles.username}>@{user.username}</Text>}
        {!!user?.email && <Text style={styles.detail}>{user.email}</Text>}
        {!!user?.phone && <Text style={styles.detail}>{user.phone}</Text>}
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>My posts ({posts.length})</Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.screen}
      data={posts}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={styles.empty}>You haven&apos;t posted anything yet</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.postCard} onPress={() => router.push(`/posts/${String(item.id)}`)}>
          <Text style={styles.postTitle}>{item.title}</Text>
          {!!item.content && (
            <Text style={styles.postContent} numberOfLines={2}>
              {item.content}
            </Text>
          )}
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 15,
    color: colors.primary,
    marginTop: 2,
  },
  detail: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 16,
    fontSize: 15,
  },
  postCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  postContent: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
})
