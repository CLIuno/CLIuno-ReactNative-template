import { Text } from 'react-native'
import type { ColorValue } from 'react-native'
// SDK 57 deprecates `Tabs` from 'expo-router' in favor of this entry point.
import { Tabs } from 'expo-router/js-tabs'

// @expo/vector-icons is no longer bundled with the expo package, so the tab
// bar uses tintable text glyphs to keep the template dependency-free.
function TabIcon({ glyph, color, size }: { glyph: string; color: ColorValue; size: number }) {
  return <Text style={{ color, fontSize: size, lineHeight: size + 4 }}>{glyph}</Text>
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen
        name="todos"
        options={{
          title: 'Todos',
          tabBarIcon: ({ color, size }) => <TabIcon glyph="✓" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Posts',
          tabBarIcon: ({ color, size }) => <TabIcon glyph="✎" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <TabIcon glyph="@" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <TabIcon glyph="☺︎" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
