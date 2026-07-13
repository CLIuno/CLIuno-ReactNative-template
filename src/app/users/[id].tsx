import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
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

interface UserRecord {
  id: string | number
  username: string
  email?: string
  first_name?: string
  last_name?: string
}

function errMsg(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message || err.message
  return err instanceof Error ? err.message : 'Something went wrong'
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const userId = String(id)
  const currentUser = useAuthStore((s) => s.user)
  const [user, setUser] = useState<UserRecord | null>(null)
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toggling, setToggling] = useState(false)

  const isSelf = !!currentUser && String(currentUser.id) === userId

  const load = useCallback(async () => {
    try {
      const userRes = await api.user.getUserById(userId)
      setUser(userRes.data.data.user ?? null)
      const followersRes = await api.follow.getFollowers(userId)
      setFollowers((followersRes.data.data.followers ?? []).length)
      const followingRes = await api.follow.getFollowing(userId)
      setFollowing((followingRes.data.data.following ?? []).length)
      const isFollowingRes = await api.follow.isFollowing(userId)
      const flag = isFollowingRes.data.data.isFollowing
      setIsFollowing(flag === true || flag === 1)
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const toggleFollow = async () => {
    setToggling(true)
    try {
      if (isFollowing) {
        await api.follow.unfollow(userId)
      } else {
        await api.follow.follow(userId)
      }
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>User not found</Text>
      </View>
    )
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{fullName || `@${user.username}`}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {!!user.email && <Text style={styles.detail}>{user.email}</Text>}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {!isSelf && (
          <Pressable
            style={[styles.followButton, isFollowing && styles.unfollowButton]}
            onPress={toggleFollow}
            disabled={toggling}
          >
            {toggling ? (
              <ActivityIndicator color={isFollowing ? colors.danger : '#fff'} />
            ) : (
              <Text style={[styles.followText, isFollowing && styles.unfollowText]}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </ScrollView>
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
  empty: {
    color: colors.muted,
    fontSize: 15,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
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
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 18,
    minWidth: 140,
    alignItems: 'center',
  },
  unfollowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  followText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  unfollowText: {
    color: colors.danger,
  },
})
