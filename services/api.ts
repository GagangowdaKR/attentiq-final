import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

const api = axios.create({ baseURL: API_BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (name: string, email: string, password: string, role: string) =>
    api.post("/auth/register", { name, email, password, role }),
  logout: () => api.post("/auth/logout"),
};

// ─── Meetings ─────────────────────────────────────────────────────────────────
export const meetingService = {
  create: (title: string) =>
    api.post("/meetings/create", { title }),
  join: (code: string) =>
    api.post("/meetings/join", { code }).catch((e) => {
      if (e.response?.status === 404) {
        throw new Error("Meeting not found");
      }
      throw e;
    }),
  leave: (meetingId: string) =>
    api.post(`/meetings/${meetingId}/leave`),
  end: (meetingId: string) =>
    api.post(`/meetings/${meetingId}/end`),
  getHistory: () =>
    api.get("/meetings/history"),
  getMeetingById: (id: string) =>
    api.get(`/meetings/${id}`),
  updateThresholds: (meetingId: string, thresholds: object) =>
    api.put(`/meetings/${meetingId}/thresholds`, thresholds),
  // method to fetch meetings by active status for a user
  getMeetingsByStatus: (userId: number | string, active: boolean) =>
    api.get(`/meetings/list/${userId}`, { params: { active } }),

  // ─── NEW DETAILED HISTORY METHOD ──────────────────────────────────────
  getDetailedHistory: (hostId: number | string) =>
    api.get(`/meetings/detail-history`, { params: { hostId } }),

  // Utility to construct screenshot URLs
  getScreenshotBlob: (path: string) => {
    const filename = path.split('/').pop() || path;
    return api.get(`/screenshot/${filename}`, { responseType: 'blob' });
  }
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventService = {
  logEvent: (payload: {
    userId: number;
    meetingId: string;
    eventType: string;
    screenshotBase64?: string;
  }) => api.post("/events/log", payload),
  getEventsForMeeting: (meetingId: string) =>
    api.get(`/events/meeting/${meetingId}`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsService = {
  getMeetingAnalytics: (meetingId: string) =>
    api.get(`/analytics/meeting/${meetingId}`),
  getHostOverview: () =>
    api.get("/analytics/host/overview"),
  getAttentionTimeline: (meetingId: string) =>
    api.get(`/analytics/meeting/${meetingId}/timeline`),
  getUserOverview: (userId: number | string) =>
    api.get(`/analytics/userOverview/${userId}`),
};

export default api;
