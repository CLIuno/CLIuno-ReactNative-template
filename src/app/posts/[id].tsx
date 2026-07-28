import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import axios from 'axios'

import api from '@/apis'
import { useAuthStore } from '@/stores/auth'

const colors = {
  primary: '#2563eb',
  danger: '#dc2626',
  text: '#111827',
  muted: '#6b7280',
  border: '#d1d5db',
  card: '#ffffff',
  bg: '#f3f4f6',
}

interface PostUser {
  id: string | number
  username?: string
  first_name?: string
  last_name?: string
}

interface Post {
  id: string | number
  title: string
  content?: string | null
  image_url?: string | null
  user?: PostUser | null
}

interface Comment {
  id: string | number
  content: string
  user?: PostUser | null
}

function errMsg(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message || err.message
  return err instanceof Error ? err.message : 'Something went wrong'
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const postId = String(id)
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.user)
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const load = useCallback(async () => {
    try {
      const postRes = await api.post.getPostById(postId)
      setPost(postRes.data.data.post ?? null)
      const commentsRes = await api.post.getComments(postId)
      setComments(commentsRes.data.data.comments ?? [])
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [postId])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const isOwner = (owner?: PostUser | null) =>
    !!currentUser && !!owner && String(owner.id) === String(currentUser.id)

  const startEdit = () => {
    if (!post) return
    setEditTitle(post.title)
    setEditContent(post.content ?? '')
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Title cannot be empty')
      return
    }
    try {
      await api.post.updatePostById(postId, {
        title: editTitle.trim(),
        content: editContent.trim(),
      })
      setEditing(false)
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    }
  }

  const deletePost = async () => {
    try {
      await api.post.deletePostById(postId)
      router.back()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    setSending(true)
    try {
      await api.post.createComment(postId, { content: newComment.trim() })
      setNewComment('')
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setSending(false)
    }
  }

  const deleteComment = async (commentId: Comment['id']) => {
    try {
      await api.post.deleteComment(postId, String(commentId))
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Post not found</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        {editing ? (
          <View>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Content"
              placeholderTextColor={colors.muted}
              multiline
            />
            <View style={styles.row}>
              <Pressable style={styles.primaryButton} onPress={saveEdit}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
              <Pressable style={styles.outlineButton} onPress={() => setEditing(false)}>
                <Text style={styles.outlineButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.title}>{post.title}</Text>
            {!!post.content && <Text style={styles.body}>{post.content}</Text>}
            {!!post.image_url && (
              <Image source={{ uri: post.image_url }} style={styles.postImage} />
            )}
            <Pressable onPress={() => post.user && router.push(`/users/${String(post.user.id)}`)}>
              <Text style={styles.meta}>@{post.user?.username ?? 'unknown'}</Text>
            </Pressable>
            {isOwner(post.user) && (
              <View style={styles.row}>
                <Pressable style={styles.outlineButton} onPress={startEdit}>
                  <Text style={styles.outlineButtonText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.dangerButton} onPress={deletePost}>
                  <Text style={styles.dangerButtonText}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

      <View style={styles.commentForm}>
        <TextInput
          style={[styles.input, styles.commentInput]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          placeholderTextColor={colors.muted}
        />
        <Pressable style={styles.primaryButton} onPress={addComment} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Send</Text>
          )}
        </Pressable>
      </View>

      {comments.length === 0 && (
        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
      )}

      {comments.map((comment) => (
        <View key={String(comment.id)} style={styles.commentCard}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>@{comment.user?.username ?? 'unknown'}</Text>
            {isOwner(comment.user) && (
              <Pressable onPress={() => deleteComment(comment.id)} hitSlop={8}>
                <Text style={styles.commentDelete}>✕</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.commentBody}>{comment.content}</Text>
        </View>
      ))}
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
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  body: {
    fontSize: 15,
    color: colors.text,
    marginTop: 8,
    lineHeight: 22,
  },
  meta: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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
    marginBottom: 10,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
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
  commentForm: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  commentInput: {
    flex: 1,
    marginBottom: 0,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
  },
  commentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  commentDelete: {
    color: colors.danger,
    fontSize: 15,
  },
  commentBody: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
})
