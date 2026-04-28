import { io, Socket } from "socket.io-client";
import { WS_URL } from "../constants";
import { useAlertStore, useMeetingStore, AlertEvent } from "../store";

let socket: Socket | null = null;

export interface ChatMessage {
  id: string;
  userId: number;
  userName: string;
  text: string;
  timestamp: string;
}

type ChatListener        = (msg: ChatMessage) => void;
type ConnectListener     = () => void;

const chatListeners:    ChatListener[]    = [];
const connectListeners: ConnectListener[] = [];

export const socketService = {
  connect: (
    token: string,
    meetingId: string,
    userInfo: { id: number; name: string; role: string },
  ) => {
    if (!token || !meetingId || !userInfo?.role) {
      console.warn("[WS] connect skipped — missing fields");
      return null;
    }
    if (socket?.connected) return socket;

    socket = io(WS_URL, {
      auth:       { token },
      query:      { meetingId, role: userInfo.role },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[WS] Connected:", socket?.id);
      // announce self
      socket?.emit("meeting:announce", {
        meetingId,
        userId:   userInfo.id,
        userName: userInfo.name,
        role:     userInfo.role,
      });
      // fire connect callbacks (WebRTC waits for this)
      connectListeners.forEach(fn => fn());
    });

    socket.on("attention:alert", (alert: AlertEvent) => {
      useAlertStore.getState().addAlert(alert);
    });

    socket.on("meeting:participant_joined", (data: { userId: number; userName: string; role: string }) => {
      console.log("[WS] Joined:", data);
      useMeetingStore.getState().addParticipant({
        id: data.userId, name: data.userName,
        isVideoOn: false, isAudioOn: false, attentionScore: 100,
      });
    });

    socket.on("meeting:participant_left", (data: { userId: number }) => {
      console.log("[WS] Left:", data.userId);
      useMeetingStore.getState().removeParticipant(data.userId);
    });

    socket.on("meeting:media_state", (data: { userId: number; isAudioOn: boolean; isVideoOn: boolean }) => {
      useMeetingStore.getState().updateParticipant(data.userId, {
        isAudioOn: data.isAudioOn, isVideoOn: data.isVideoOn,
      });
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      chatListeners.forEach(fn => fn(msg));
    });

    // Host ended meeting → all participants go home
    socket.on("meeting:ended", () => {
      console.log("[WS] Meeting ended by host");
      useMeetingStore.getState().leaveMeeting();
      // navigate via window.location — works on web
      if (typeof window !== "undefined") {
        window.location.hash = ""; // clear hash
        window.location.href = "/";
      }
    });

    socket.on("disconnect", () => console.log("[WS] Disconnected"));
    socket.on("connect_error", (e) => console.warn("[WS] Connect error:", e.message));

    return socket;
  },

  disconnect: () => {
    socket?.disconnect();
    socket = null;
    chatListeners.length    = 0;
    connectListeners.length = 0;
  },

  // Called by WebRTC to know when socket is ready
  onConnect: (fn: ConnectListener) => {
    connectListeners.push(fn);
    // If already connected, fire immediately
    if (socket?.connected) fn();
    return () => {
      const i = connectListeners.indexOf(fn);
      if (i > -1) connectListeners.splice(i, 1);
    };
  },

  emitMediaState: (meetingId: string, isAudioOn: boolean, isVideoOn: boolean) => {
    socket?.emit("meeting:media_state", { meetingId, isAudioOn, isVideoOn });
  },

  sendChat: (meetingId: string, userId: number, userName: string, text: string): ChatMessage => {
    const msg: ChatMessage = {
      id:        `${Date.now()}-${userId}`,
      userId,    userName,  text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    socket?.emit("chat:message", { meetingId, ...msg });
    return msg;
  },

  onChat: (fn: ChatListener) => {
    chatListeners.push(fn);
    return () => {
      const i = chatListeners.indexOf(fn);
      if (i > -1) chatListeners.splice(i, 1);
    };
  },

  emit:      (event: string, data: any) => socket?.emit(event, data),
  getSocket: () => socket,
  isConnected: () => socket?.connected ?? false,
};