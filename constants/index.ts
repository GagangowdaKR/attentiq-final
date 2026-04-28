// ─── Server URLs ─────────────────────────────────────────────────────────────
// Change these to your machine's LAN IP when testing on a physical device
export const API_BASE_URL = "http://localhost:8080/api";
export const AI_SERVICE_URL = "http://localhost:5001";
// Socket.IO runs on its own port (9092), separate from the Spring Boot REST API (8080)
export const WS_URL = "http://localhost:9092";

// ─── Detection Defaults ───────────────────────────────────────────────────────
export const DEFAULT_THRESHOLDS = {
  eyeCloseDuration: 60,       // seconds
  faceMissingDuration: 30,    // seconds
  phoneDetectionEnabled: true,
};

// ─── Event Types (must match backend enum) ───────────────────────────────────
export const EVENT_TYPES = {
  EYES_CLOSED:    "EYES_CLOSED",
  FACE_MISSING:   "FACE_MISSING",
  PHONE_DETECTED: "PHONE_DETECTED",
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  HOST:        "HOST",
  PARTICIPANT: "PARTICIPANT",
};

// ─── Attention Score Bands ───────────────────────────────────────────────────
export const ATTENTION_BANDS = {
  HIGH:   { min: 80, label: "Focused",    color: "#4ADEAA" },
  MEDIUM: { min: 50, label: "Distracted", color: "#FFB347" },
  LOW:    { min: 0,  label: "Disengaged", color: "#FF4D6D" },
};