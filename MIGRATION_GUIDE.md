# Jellyvision React Migration Guide

## Project Created ✅

Location: `/media/dominique/Development/E1N/jellyvision-react`

Stack:

- **Build Tool**: Vite 7.3.1
- **Framework**: React 19.2.3 + TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.1.18
- **Router**: React Router 7.11.0
- **State**: Zustand 5.0.9
- **i18n**: react-i18next 16.5.1
- **API Client**: @jellyfin/client-axios 10.7.8 (same as current)
- **Package Manager**: pnpm 10.24.0

## Next Steps

### 1. Set up shadcn/ui

```bash
cd /media/dominique/Development/E1N/jellyvision-react
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react
```

Create `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2. Project Structure

```
src/
├── components/
│   ├── ui/             # shadcn components
│   ├── buttons/        # Convert Vue button components
│   ├── forms/          # LoginForm, AddServerForm, etc.
│   ├── item/           # Media item components
│   └── players/        # Video/audio players
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Library.tsx
│   └── ItemDetail.tsx
├── store/
│   ├── useAuthStore.ts
│   ├── usePlayerStore.ts
│   └── useUIStore.ts
├── hooks/
│   ├── useJellyfinAPI.ts
│   ├── useMediaQuery.ts
│   └── useLocalStorage.ts
├── lib/
│   ├── jellyfin/       # API client setup
│   ├── utils.ts
│   └── constants.ts
├── locales/            # Copy from original
│   ├── en-US.json
│   ├── es.json
│   └── ...
├── types/
│   └── index.ts
└── App.tsx
```

### 3. API Client Setup

Create `src/lib/jellyfin/client.ts`:

```typescript
import { Configuration, ItemsApi, UserApi } from '@jellyfin/client-axios';
import axios from 'axios';

const axiosInstance = axios.create({
  timeout: 10000
});

export const createJellyfinClient = (baseURL: string, token?: string) => {
  const config = new Configuration({
    basePath: baseURL,
    accessToken: token
  });

  return {
    items: new ItemsApi(config, baseURL, axiosInstance),
    user: new UserApi(config, baseURL, axiosInstance)
    // Add other APIs as needed
  };
};
```

### 4. Zustand Store Example

Create `src/store/useAuthStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  serverUrl: string | null;
  accessToken: string | null;
  userId: string | null;
  setAuth: (server: string, token: string, userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      serverUrl: null,
      accessToken: null,
      userId: null,
      setAuth: (serverUrl, accessToken, userId) =>
        set({ serverUrl, accessToken, userId }),
      logout: () => set({ serverUrl: null, accessToken: null, userId: null })
    }),
    {
      name: 'jellyfin-auth'
    }
  )
);
```

### 5. React Router Setup

Update `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

Update `src/App.tsx`:

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Home from './pages/Home';
import Library from './pages/Library';
import ItemDetail from './pages/ItemDetail';

function App() {
  const { accessToken } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {accessToken ? (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/library/:id" element={<Library />} />
          <Route path="/item/:id" element={<ItemDetail />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
```

### 6. i18n Setup

Create `src/i18n.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from './locales/en-US.json';
import es from './locales/es.json';

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    es: { translation: es }
    // Add others
  },
  lng: localStorage.getItem('language') || 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
```

### 7. Component Migration Strategy

#### Example: LoginForm.vue → LoginForm.tsx

**Original (Vue)**:

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" />
    <input v-model="password" type="password" />
    <button type="submit">{{ $t('login') }}</button>
  </form>
</template>

<script lang="ts">
export default {
  data() {
    return {
      username: '',
      password: ''
    };
  },
  methods: {
    handleSubmit() {
      // Login logic
    }
  }
};
</script>
```

**React Version**:

```typescript
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Login logic
    // setAuth(serverUrl, token, userId)
    // navigate('/')
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={t('username')}
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('password')}
      />
      <Button type="submit">{t('login')}</Button>
    </form>
  );
}
```

### 8. Migration Priorities

**Phase 1: Core Infrastructure (Week 1)**

- [x] Project setup
- [ ] Tailwind + shadcn/ui components
- [ ] Router configuration
- [ ] Auth store + API client
- [ ] i18n setup

**Phase 2: Authentication Flow (Week 2)**

- [ ] Login page
- [ ] Server selection
- [ ] User management
- [ ] Session persistence

**Phase 3: Core Features (Weeks 3-4)**

- [ ] Home page with library sections
- [ ] Media item cards/grids
- [ ] Item detail pages
- [ ] Basic playback

**Phase 4: Media Player (Week 5)**

- [ ] Video player integration
- [ ] Audio controls
- [ ] Playback queue
- [ ] Seek/volume controls

**Phase 5: Advanced Features (Weeks 6-8)**

- [ ] Search functionality
- [ ] Filters and sorting
- [ ] User preferences
- [ ] Settings pages
- [ ] Metadata editor

## Key Differences to Note

### State Management

- **Vue/Vuex**: `this.$store.commit('mutation')`, `this.$store.dispatch('action')`
- **React/Zustand**: `const { state, action } = useStore()`, `action()`

### Reactivity

- **Vue**: Automatic with `data()`, `computed`, `watch`
- **React**: Manual with `useState`, `useMemo`, `useEffect`

### Templates

- **Vue**: `<template>` with `v-if`, `v-for`, `@click`
- **React**: JSX with `&&`, `.map()`, `onClick`

### Component Communication

- **Vue**: `$emit`, `props`, `provide/inject`
- **React**: `props`, callbacks, Context API

### Lifecycle

- **Vue**: `mounted`, `updated`, `destroyed`
- **React**: `useEffect` with dependencies

## Development Workflow

Start the dev server:

```bash
cd /media/dominique/Development/E1N/jellyvision-react
pnpm dev
```

The new app runs on `http://localhost:5173/` (no conflicts with Nuxt on :3000)

## Useful Resources

- [shadcn/ui docs](https://ui.shadcn.com/)
- [Zustand docs](https://docs.pmnd.rs/zustand/)
- [React Router v7](https://reactrouter.com/)
- [react-i18next](https://react.i18next.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Notes

- The @jellyfin/client-axios package is deprecated. Consider migrating to @jellyfin/sdk later
- No SSR means simpler deployment (static hosting)
- Keep the original project running during migration for reference
- Test on http://192.168.1.150:5173/ for network access

---

**Project Status**: Foundation ready ✅  
**Next Action**: Install shadcn/ui components and start with authentication flow
