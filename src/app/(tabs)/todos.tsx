import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
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
  user?: { id: string | number; username?: string } | null
}

const isDone = (todo: Todo) => todo.is_completed === true || todo.is_completed === 1

function errMsg(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message || err.message
  return err instanceof Error ? err.message : 'Something went wrong'
}

export default function TodosScreen() {
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.todo.getAllTodos()
      setTodos(res.data.data.todos ?? [])
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

  const createTodo = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title')
      return
    }
    setCreating(true)
    try {
      await api.todo.createTodo({ title: title.trim(), description: description.trim() })
      setTitle('')
      setDescription('')
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    } finally {
      setCreating(false)
    }
  }

  const toggleTodo = async (id: Todo['id']) => {
    try {
      await api.todo.toggleTodo(String(id))
      await load()
    } catch (err) {
      Alert.alert('Error', errMsg(err))
    }
  }

  const deleteTodo = async (id: Todo['id']) => {
    try {
      await api.todo.deleteTodo(String(id))
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

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="What needs to be done?"
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          placeholderTextColor={colors.muted}
          value={description}
          onChangeText={setDescription}
        />
        <Pressable style={styles.addButton} onPress={createTodo} disabled={creating}>
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add todo</Text>
          )}
        </Pressable>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No todos yet. Add your first one!</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/todos/${String(item.id)}`)}>
            <Pressable
              style={[styles.checkbox, isDone(item) && styles.checkboxDone]}
              onPress={() => toggleTodo(item.id)}
              hitSlop={8}
            >
              {isDone(item) && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, isDone(item) && styles.cardTitleDone]}>
                {item.title}
              </Text>
              {!!item.description && (
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              {!!item.user?.username && <Text style={styles.cardMeta}>@{item.user.username}</Text>}
            </View>
            <Pressable onPress={() => deleteTodo(item.id)} hitSlop={8}>
              <Text style={styles.delete}>✕</Text>
            </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  delete: {
    color: colors.danger,
    fontSize: 18,
    paddingHorizontal: 6,
  },
})
