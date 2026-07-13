# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing
any code. Two examples that bite: `Tabs` now imports from `expo-router/js-tabs`, and
`@react-native-async-storage/async-storage` v3 renamed `multiRemove` → `removeMany`.

# CLIuno React Native template

Expo SDK 57 (expo-router, TypeScript) client implementing the CLIuno demo app
(auth, todos, posts+comments, users, follows) against the shared CLIuno REST contract.

## Commands

```bash
npm install
npm start                  # expo dev server (a = android, i = ios, w = web)
npm run lint               # oxlint
npm run format             # oxfmt src/
npm run type-check         # tsc --noEmit
```

`EXPO_PUBLIC_API_BASE` picks the backend (default `http://localhost:3000/api/v1`;
Android emulators need `http://10.0.2.2:<port>/api/v1`) — see `.env.example`.

## Structure

- `src/apis/` — the API layer (`auth-api`, `user-api`, `todo-api`, `post-api`,
  `follow-api`) on an axios instance in `http.ts`; **identical surface to the React web
  template**. Bearer token from AsyncStorage (async request interceptor); 401 clears the
  stored session. **Keep every URL here** — the CLIuno compatibility matrix parses
  `src/apis/*.ts`.
- `src/stores/auth.ts` — zustand store; AsyncStorage is async, so the app calls
  `hydrate()` once from the root layout (never assume the token is loaded at import time).
- `src/app/` — expo-router routes: `login`, `register`, `forgot-password`,
  `(tabs)/{todos,posts,users,profile}`, and detail routes `todos/[id]`, `posts/[id]`,
  `users/[id]`. Plain StyleSheet styling, no UI kit.

## The API contract (what backends guarantee)

Login sends `{usernameOrEmail, password}` and reads `data.token`. Responses are
`{status, message, data}` with exact keys `data.users/user/todos/todo/posts/post/`
`followers/following/isFollowing`; register sends snake_case fields. SQLite-backed
templates serialize booleans as 0/1 — compare with `=== true || === 1`. Interpolate ids
with `String(...)` (numeric in some backends, uuid in others).

## Conventions

oxc-only lint/format (`semi: false`, single quotes); explicit imports (no auto-import
globals here); conventional commits.
