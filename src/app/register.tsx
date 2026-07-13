import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuthStore } from '@/stores/auth'

const colors = {
  primary: '#2563eb',
  text: '#111827',
  muted: '#6b7280',
  border: '#d1d5db',
}

const emptyForm = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
}

type Form = typeof emptyForm

const fields: {
  key: keyof Form
  label: string
  secure?: boolean
  keyboardType?: 'email-address' | 'phone-pad'
  noCaps?: boolean
}[] = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'username', label: 'Username', noCaps: true },
  { key: 'email', label: 'Email', keyboardType: 'email-address', noCaps: true },
  { key: 'phone', label: 'Phone', keyboardType: 'phone-pad' },
  { key: 'password', label: 'Password', secure: true },
  { key: 'password_confirmation', label: 'Confirm password', secure: true },
]

export default function RegisterScreen() {
  const router = useRouter()
  const register = useAuthStore((s) => s.register)
  const loading = useAuthStore((s) => s.loading)
  const [form, setForm] = useState<Form>(emptyForm)

  const setField = (key: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    if (fields.some(({ key }) => !form[key].trim())) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (form.password !== form.password_confirmation) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }
    try {
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      Alert.alert('Success', 'Account created. You can now sign in.')
      router.back()
    } catch {
      Alert.alert('Error', useAuthStore.getState().error || 'Registration failed')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join the CLIuno demo app</Text>

          {fields.map(({ key, label, secure, keyboardType, noCaps }) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={label}
              placeholderTextColor={colors.muted}
              secureTextEntry={secure}
              keyboardType={keyboardType}
              autoCapitalize={noCaps ? 'none' : 'sentences'}
              autoCorrect={false}
              value={form[key]}
              onChangeText={(value) => setField(key, value)}
            />
          ))}

          <Pressable style={styles.button} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
  },
})
