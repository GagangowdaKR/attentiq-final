import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, ActivityIndicator, RefreshControl,
} from "react-native";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { meetingService } from "../../services/api";
import { useAlertStore, useMeetingStore, AlertEvent } from "../../store";

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, onAck }: { alert: AlertEvent; onAck: (id: string) => void }) {
  const map: Record<string, { color: string; emoji: string; label: string }> = {
    EYES_CLOSED:    { color: "#FF4D6D", emoji: "😴", label: "Eyes Closed"    },
    FACE_MISSING:   { color: "#FFB347", emoji: "👻", label: "Face Missing"   },
    PHONE_DETECTED: { color: "#6C63FF", emoji: "📱", label: "Phone Detected" },
  };
  const t = map[alert.eventType] ?? { color: "#9090A8", emoji: "⚠️", label: alert.eventType };

  return (
    <View style={{
      backgroundColor: "#1C1C28", borderRadius: 14,
      borderWidth: 1, borderLeftWidth: 3,
      borderColor: alert.acknowledged ? "#2A2A3D" : t.color + "55",
      borderLeftColor: alert.acknowledged ? "#2A2A3D" : t.color,
      padding: 14, marginBottom: 10,
      opacity: alert.acknowledged ? 0.5 : 1,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
          <View>
            <Text style={{ color: "#E8E8F0", fontWeight: "700", fontSize: 13 }}>{alert.userName}</Text>
            <Text style={{ color: t.color, fontSize: 11, marginTop: 2 }}>{t.label}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#4A4A6A", fontSize: 11 }}>{alert.timestamp}</Text>
          {!alert.acknowledged && (
            <TouchableOpacity onPress={() => onAck(alert.id)} style={{ marginTop: 6 }}>
              <Text style={{ color: "#00D4AA", fontSize: 11, fontWeight: "600" }}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Threshold Row ────────────────────────────────────────────────────────────
function ThresholdRow({ label, value, onInc, onDec }: any) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#2A2A3D",
    }}>
      <Text style={{ color: "#E8E8F0", fontSize: 13 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <TouchableOpacity onPress={onDec} style={{
          width: 32, height: 32, borderRadius: 16, backgroundColor: "#2A2A3D",
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ color: "#E8E8F0", fontSize: 18, lineHeight: 22 }}>−</Text>
        </TouchableOpacity>
        <Text style={{ color: "#6C63FF", fontWeight: "700", fontSize: 15, minWidth: 54, textAlign: "center" }}>
          {value}s
        </Text>
        <TouchableOpacity onPress={onInc} style={{
          width: 32, height: 32, borderRadius: 16, backgroundColor: "#2A2A3D",
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ color: "#E8E8F0", fontSize: 18, lineHeight: 22 }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type Tab = "live" | "history" | "settings";

export default function DashboardScreen() {
  const { alerts, unreadCount, acknowledgeAlert } = useAlertStore();
  const { meetingId, thresholds, updateThresholds } = useMeetingStore();
  const [tab, setTab]             = useState<Tab>("live");
  const [meetings, setMeetings]   = useState<any[]>([]);
  const [refreshing, setRefresh]  = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await meetingService.getHistory();
      setMeetings(res.data);
    } catch (_) {}
  };

  const onRefresh = async () => {
    setRefresh(true);
    await fetchHistory();
    setRefresh(false);
  };

  const applyThresholds = async () => {
    if (!meetingId) return;
    setSaving(true);
    try { await meetingService.updateThresholds(meetingId, thresholds); }
    catch (_) {}
    setSaving(false);
  };

  const eyeCount   = alerts.filter((a) => a.eventType === "EYES_CLOSED").length;
  const faceCount  = alerts.filter((a) => a.eventType === "FACE_MISSING").length;
  const phoneCount = alerts.filter((a) => a.eventType === "PHONE_DETECTED").length;

  return (
    <LinearGradient colors={["#0A0A0F", "#13131A"]} style={{ flex: 1 }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: "#9090A8", fontSize: 11, letterSpacing: 3 }}>HOST PANEL</Text>
          <Text style={{ color: "#E8E8F0", fontSize: 26, fontWeight: "800", marginTop: 4 }}>Dashboard</Text>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Eyes Closed",  count: eyeCount,   color: "#FF4D6D", emoji: "😴" },
            { label: "Face Missing", count: faceCount,  color: "#FFB347", emoji: "👻" },
            { label: "Phone",        count: phoneCount, color: "#6C63FF", emoji: "📱" },
          ].map((s) => (
            <View key={s.label} style={{
              flex: 1, backgroundColor: "#1C1C28", borderRadius: 14,
              borderWidth: 1, borderColor: s.color + "33", padding: 14, alignItems: "center",
            }}>
              <Text style={{ fontSize: 20, marginBottom: 6 }}>{s.emoji}</Text>
              <Text style={{ color: s.color, fontSize: 22, fontWeight: "800" }}>{s.count}</Text>
              <Text style={{ color: "#9090A8", fontSize: 10, marginTop: 2, textAlign: "center" }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tab Bar */}
        <View style={{
          flexDirection: "row", backgroundColor: "#1C1C28",
          borderRadius: 12, padding: 4, marginBottom: 20,
        }}>
          {(["live", "history", "settings"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t} onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                backgroundColor: tab === t ? "#6C63FF" : "transparent",
              }}
            >
              <Text style={{ color: tab === t ? "#fff" : "#9090A8", fontWeight: tab === t ? "700" : "400", fontSize: 12 }}>
                {t === "live"     ? `🔴 Live${unreadCount > 0 ? ` (${unreadCount})` : ""}` :
                 t === "history"  ? "📋 History" : "⚙️ Settings"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIVE ALERTS */}
        {tab === "live" && (
          alerts.length === 0
            ? (
              <View style={{ alignItems: "center", paddingVertical: 60 }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>✅</Text>
                <Text style={{ color: "#9090A8", fontSize: 14 }}>No alerts yet</Text>
                <Text style={{ color: "#4A4A6A", fontSize: 12, marginTop: 4 }}>All participants are attentive</Text>
              </View>
            )
            : alerts.map((a) => <AlertCard key={a.id} alert={a} onAck={acknowledgeAlert} />)
        )}

        {/* MEETING HISTORY */}
        {tab === "history" && (
          meetings.length === 0
            ? (
              <View style={{ alignItems: "center", paddingVertical: 60 }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
                <Text style={{ color: "#9090A8", fontSize: 14 }}>No past meetings</Text>
              </View>
            )
            : meetings.map((m) => (
              <View key={m.id} style={{
                backgroundColor: "#1C1C28", borderRadius: 14,
                borderWidth: 1, borderColor: "#2A2A3D", padding: 16, marginBottom: 10,
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#E8E8F0", fontWeight: "700" }}>{m.title}</Text>
                  <Text style={{ color: "#4A4A6A", fontSize: 11 }}>{m.date}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                  <Text style={{ color: "#9090A8", fontSize: 12 }}>👥 {m.participantCount}</Text>
                  <Text style={{ color: "#9090A8", fontSize: 12 }}>⚠️ {m.alertCount} alerts</Text>
                  <Text style={{ color: m.avgAttention > 70 ? "#4ADEAA" : "#FFB347", fontSize: 12 }}>
                    🎯 {m.avgAttention}%
                  </Text>
                </View>
              </View>
            ))
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <View style={{
            backgroundColor: "#1C1C28", borderRadius: 16,
            borderWidth: 1, borderColor: "#2A2A3D", padding: 20,
          }}>
            <Text style={{ color: "#E8E8F0", fontWeight: "700", fontSize: 15, marginBottom: 4 }}>
              Detection Thresholds
            </Text>
            <Text style={{ color: "#4A4A6A", fontSize: 12, marginBottom: 20 }}>
              Applies to the currently active meeting
            </Text>

            <ThresholdRow
              label="😴  Eye Close Alert"
              value={thresholds.eyeCloseDuration}
              onDec={() => updateThresholds({ eyeCloseDuration: Math.max(10, thresholds.eyeCloseDuration - 10) })}
              onInc={() => updateThresholds({ eyeCloseDuration: thresholds.eyeCloseDuration + 10 })}
            />
            <ThresholdRow
              label="👻  Face Missing Alert"
              value={thresholds.faceMissingDuration}
              onDec={() => updateThresholds({ faceMissingDuration: Math.max(5, thresholds.faceMissingDuration - 5) })}
              onInc={() => updateThresholds({ faceMissingDuration: thresholds.faceMissingDuration + 5 })}
            />
            <View style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingVertical: 14,
            }}>
              <Text style={{ color: "#E8E8F0", fontSize: 13 }}>📱  Phone Detection</Text>
              <Switch
                value={thresholds.phoneDetectionEnabled}
                onValueChange={(v) => updateThresholds({ phoneDetectionEnabled: v })}
                trackColor={{ true: "#6C63FF", false: "#2A2A3D" }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity
              onPress={applyThresholds}
              disabled={saving || !meetingId}
              style={{
                backgroundColor: meetingId ? "#6C63FF" : "#2A2A3D",
                borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8,
              }}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: meetingId ? "#fff" : "#4A4A6A", fontWeight: "700" }}>
                    {meetingId ? "Apply to Current Meeting" : "No Active Meeting"}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
}
