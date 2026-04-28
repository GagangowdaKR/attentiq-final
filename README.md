# ATTENTIQ — Frontend
### React Native (Expo) · Web + Android + iOS · NativeWind (Tailwind)

---

## ▶️  SETUP — Copy-paste these commands one by one

### Step 1 — Install Node.js (if not installed)
```
node -v        # should be v18 or above
npm -v         # should be v9 or above
```

### Step 2 — Install Expo CLI globally
```
npm install -g expo-cli
```

### Step 3 — Enter the project folder
```
cd attentiq-frontend
```

### Step 4 — Install all dependencies
```
npm install
```

### Step 5 — Run on Web (easiest to test first)
```
npx expo start --web
```

### Step 6 — Run on Android (need Android Studio + emulator OR physical device)
```
npx expo start --android
```

### Step 7 — Run on iOS (Mac only)
```
npx expo start --ios
```

---

## ⚙️  Configure Your Backend URL

Before running, open  `constants/index.ts`  and change:

```ts
export const API_BASE_URL  = "http://localhost:8080/api";   // Spring Boot
export const AI_SERVICE_URL = "http://localhost:5001";       // Python AI
export const WS_URL         = "http://localhost:8080";       // WebSocket
```

> If testing on a **physical Android/iOS device**, replace `localhost`
> with your computer's **LAN IP** (e.g. `192.168.1.5`)

---

## 📁  Project Folder Structure

```
attentiq-frontend/
│
├── app/
│   ├── _layout.tsx              ← Root layout + auth guard (redirect logic)
│   │
│   ├── (auth)/                  ← Auth screens (not shown in tab bar)
│   │   ├── _layout.tsx
│   │   ├── login.tsx            ← Login screen
│   │   └── register.tsx         ← Register screen (HOST / PARTICIPANT role)
│   │
│   ├── (tabs)/                  ← Main app tab screens
│   │   ├── _layout.tsx          ← Bottom tab bar (hides Dashboard for non-hosts)
│   │   ├── home.tsx             ← Join meeting / Create meeting
│   │   ├── dashboard.tsx        ← Host: live alerts, history, thresholds
│   │   ├── analytics.tsx        ← Charts, KPIs, meeting breakdown
│   │   └── profile.tsx          ← User profile + logout
│   │
│   └── meeting/
│       ├── _layout.tsx
│       └── [id].tsx             ← Live meeting room (WebRTC tiles + controls)
│
├── components/                  ← (Add shared components here)
│
├── services/
│   ├── api.ts                   ← All Axios REST calls (auth / meeting / events / analytics)
│   └── socket.ts                ← Socket.io real-time connection
│
├── store/
│   └── index.ts                 ← Zustand state (AuthStore, MeetingStore, AlertStore)
│
├── constants/
│   └── index.ts                 ← API URLs, thresholds, event types, colors
│
├── app.json                     ← Expo app config
├── babel.config.js              ← Babel + NativeWind
├── tailwind.config.js           ← Tailwind color tokens
├── tsconfig.json                ← TypeScript config
└── package.json                 ← All dependencies
```

---

## 🗂️  Screens Summary

| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/(auth)/login` | Email + password login |
| Register | `/(auth)/register` | Create account, pick HOST or PARTICIPANT role |
| Home | `/(tabs)/home` | Join meeting by code / Create meeting (HOST only) |
| Meeting Room | `/meeting/[id]` | Live video tiles, mute/cam controls, AI active badge |
| Dashboard | `/(tabs)/dashboard` | Live alerts, meeting history, threshold settings (HOST only) |
| Analytics | `/(tabs)/analytics` | Weekly chart, alert breakdown, per-meeting scores |
| Profile | `/(tabs)/profile` | User info, settings, logout |

---

## 🔌  State Management (Zustand)

| Store | What it manages |
|-------|----------------|
| `useAuthStore` | user, isAuthenticated, setUser, logout |
| `useMeetingStore` | meetingId, code, participants, thresholds, isHost |
| `useAlertStore` | real-time AI alerts, unread badge count |

---

## 🌐  API Calls (services/api.ts)

| Service | Methods |
|---------|---------|
| `authService` | login, register, logout |
| `meetingService` | create, join, leave, end, getHistory, updateThresholds |
| `eventService` | logEvent, getEventsForMeeting |
| `analyticsService` | getMeetingAnalytics, getHostOverview, getAttentionTimeline |

---

## ✅  What's Ready

- [x] Auth flow (login / register / JWT storage / auto-redirect)
- [x] Role-based UI (HOST sees Dashboard tab + Create Meeting)
- [x] Meeting join + create
- [x] Live meeting room with participant tiles + controls
- [x] Real-time alert strip (host view, live during meeting)
- [x] Host dashboard — live alerts, history, threshold controls
- [x] Analytics — KPI cards, weekly chart, alert breakdown, per-meeting scores
- [x] Socket.io connected for real-time alert push
- [x] Zustand global state
- [x] All API calls stubbed and ready to connect to Spring Boot

---

## ➡️  Next Steps

1. **Backend** → Spring Boot + MySQL
2. **AI Service** → Python + MediaPipe + YOLOv8
