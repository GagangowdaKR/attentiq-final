import { create } from "zustand";
import { DEFAULT_THRESHOLDS } from "../constants";
import api from "@/services/api";

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

// export const useAuthStore = create<AuthState>((set) => ({
//   user: null,
//   isAuthenticated: false,
//   setUser: (user) => set({ user, isAuthenticated: true }),
//   logout: () => set({ user: null, isAuthenticated: false }),
// }));

// ─── Meeting Store ────────────────────────────────────────────────────────────
interface Participant {
  id: number;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  attentionScore: number;
  stream?: any;
}

interface MeetingState {
  meetingId: string | null;
  meetingCode: string | null;
  participants: Participant[];
  isHost: boolean;
  isInMeeting: boolean;
  localStream: any;
  thresholds: typeof DEFAULT_THRESHOLDS;
  setMeeting: (id: string, code: string, isHost: boolean) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (id: number) => void;
  updateParticipant: (id: number, data: Partial<Participant>) => void;
  setLocalStream: (stream: any) => void;
  updateThresholds: (t: Partial<typeof DEFAULT_THRESHOLDS>) => void;
  leaveMeeting: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetingId: null,
  meetingCode: null,
  participants: [],
  isHost: false,
  isInMeeting: false,
  localStream: null,
  thresholds: DEFAULT_THRESHOLDS,
  setMeeting: (id, code, isHost) =>
    set({ meetingId: id, meetingCode: code, isHost, isInMeeting: true }),
  addParticipant: (p) =>
    set((s) => ({ participants: [...s.participants, p] })),
  removeParticipant: (id) =>
    set((s) => ({ participants: s.participants.filter((p) => p.id !== id) })),
  updateParticipant: (id, data) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
  setLocalStream: (stream) => set({ localStream: stream }),
  updateThresholds: (t) =>
    set((s) => ({ thresholds: { ...s.thresholds, ...t } })),
  leaveMeeting: () =>
    set({
      meetingId: null,
      meetingCode: null,
      participants: [],
      isHost: false,
      isInMeeting: false,
      localStream: null,
    }),
}));

// ─── Alert Store ──────────────────────────────────────────────────────────────
export interface AlertEvent {
  id: string;
  userId: number;
  userName: string;
  meetingId: string;
  eventType: "EYES_CLOSED" | "FACE_MISSING" | "PHONE_DETECTED";
  timestamp: string;
  screenshotUrl?: string;
  acknowledged: boolean;
}

interface AlertState {
  alerts: AlertEvent[];
  unreadCount: number;
  addAlert: (alert: AlertEvent) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,
  addAlert: (alert) =>
    set((s) => ({ alerts: [alert, ...s.alerts], unreadCount: s.unreadCount + 1 })),
  acknowledgeAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
}));

// ─── GLOBAL RECOVERY CONFIGURATION ───────────────────────────────────
// This runs instantly on browser refresh before any UI screens mount
const getInitialAuthState = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const hostId = localStorage.getItem("userId"); 
    const userType = localStorage.getItem("userType");

    if (token && hostId) {
      // Prime your Axios instance global headers immediately for background API calls
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return {
        isAuthenticated: true,
        user: {
          id: parseInt(hostId, 10),
          role: (userType === "PARTICIPANT" ? "PARTICIPANT" : "HOST") as "HOST" | "PARTICIPANT",
          token: token,
          name: "",  // Will reload from profile/backend on demand
          email: ""
        }
      };
    }
  }
  
  // Default fallback state if no storage is active
  return { isAuthenticated: false, user: null };
};

const initialState = getInitialAuthState();

// ─── STORE DEFINITION ────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({
  user: initialState.user,
  isAuthenticated: initialState.isAuthenticated,
  
  setUser: (user) => {
    if (user && typeof window !== "undefined") {
      localStorage.setItem("token", user.token);
      localStorage.setItem("userId", user.id.toString());
      localStorage.setItem("userType", user.role);
    }
    set({ user, isAuthenticated: !!user });
  },
  
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userType");
    }
    set({ user: null, isAuthenticated: false });
  },
}));