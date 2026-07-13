import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import axios from 'axios'

import api from '@/apis'

const colors = {
  primary: '#2563eb',
  danger: '#dc2626',
  success: '#16a34a',
  text: '#111827',
  muted: '#6b7280',
  border: '#d1d5db',
  card: '#ffffff',
  bg: '#f3f4f6',
}

interface Todo {
  id: string | number
  title: string
  description?: string | null
  is_completed: boolean | 0 | 1
}

function errMsg(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message || err.message
  return err instanceof Error ? err.message : 'Something went wrong'
}

export default function TodoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const todoId = String(id)
  const router = useRouter()
  const [todo, setTodo] = useState<Todo | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.todo.getTodoById(todoId)
      const data: Todo = res.data.data.todo
      setTodo(data)
      setTitle(data.title ?? '')
      setDescription(data.description ?? '')
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [todoId])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title cannot be empty')
      return
    }
    setSaving(true)
    try {
      await api.todo.updateTodo(todoId, { title: title.trim(), description: description.trim() })
      Alert.alert('Success', 'Todo updated')
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const toggle = async () => {
    try {
      await api.todo.toggleTodo(todoId)
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    }
  }

  const remove = async () => {
    try {
      await api.todo.deleteTodo(todoId)
      router.back()
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

  if (!todo) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Todo not found</Text>
      </View>
    )
  }

  const done = todo.is_completed === true || todo.is_completed === 1

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        placeholderTextColor={colors.muted}
        multiline
      />

      <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save changes</Text>
        )}
      </Pressable>

      <Pressable style={[styles.toggleButton, done && styles.toggleButtonDone]} onPress={toggle}>
        <Text style={[styles.toggleText, done && styles.toggleTextDone]}>
          {done ? '✓ Completed — mark as active' : 'Mark as completed'}
        </Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={remove}>
        <Text style={styles.deleteText}>Delete todo</Text>
      </Pressable>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  toggleButtonDone: {
    backgroundColor: colors.success,
  },
  toggleText: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTextDone: {
    color: '#fff',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
})
