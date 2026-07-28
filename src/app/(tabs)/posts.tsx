import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import axios from 'axios'

import api from '@/apis'

const colors = {
  primary: '#2563eb',
  text: '#111827',
  muted: '#6b7280',
  border: '#d1d5db',
  card: '#ffffff',
  bg: '#f3f4f6',
}

interface Post {
  id: string | number
  title: string
  content?: string | null
  image_url?: string | null
  user?: { id: string | number; username?: string } | null
}

function errMsg(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message || err.message
  return err instanceof Error ? err.message : 'Something went wrong'
}

export default function PostsScreen() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.post.getAllPosts()
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
    load()
  }

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] })
    if (picked.canceled || !picked.assets[0]) return

    const asset = picked.assets[0]
    setUploading(true)
    try {
      const res = await api.upload.uploadImage({
        uri: asset.uri,
        name: asset.fileName,
        mimeType: asset.mimeType,
      })
      setImageUrl(res.data.data.url)
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setUploading(false)
    }
  }

  const createPost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please enter a title and content')
      return
    }
    setCreating(true)
    try {
      await api.post.createPost({
        title: title.trim(),
        content: content.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })
      setTitle('')
      setContent('')
      setImageUrl('')
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Post title"
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Share something..."
          placeholderTextColor={colors.muted}
          value={content}
          onChangeText={setContent}
          multiline
        />
        {!!imageUrl && <Image source={{ uri: imageUrl }} style={styles.preview} />}
        <Pressable style={styles.imageButton} onPress={pickImage} disabled={uploading}>
          <Text style={styles.imageButtonText}>
            {uploading ? 'Uploading…' : imageUrl ? 'Replace image' : 'Add image'}
          </Text>
        </Pressable>
        <Pressable style={styles.addButton} onPress={createPost} disabled={creating}>
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Publish</Text>
          )}
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet. Be the first!</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/posts/${String(item.id)}`)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!!item.content && (
              <Text style={styles.cardContent} numberOfLines={2}>
                {item.content}
              </Text>
            )}
            {!!item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.cardImage} />
            )}
            <Text style={styles.cardMeta}>@{item.user?.username ?? 'unknown'}</Text>
          </Pressable>
        )}
      />
    </View>
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
  form: {
    padding: 16,
    paddingBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  imageButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  imageButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 32,
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardContent: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
  },
})
