import { create } from "zustand";
import { DEFAULT_THRESHOLDS } from "../constants";

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  role: "HOST" | "PARTICIPANT";
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

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
