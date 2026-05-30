import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, ActivityIndicator, RefreshControl, Modal, Image
} from "react-native";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { meetingService } from "../../services/api";
import { useMeetingStore } from "../../store";

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

type Tab = "detailHistory" | "history" | "settings";

export default function DashboardScreen() {
  const { meetingId, thresholds, updateThresholds } = useMeetingStore();
  const [tab, setTab]                           = useState<Tab>("detailHistory");
  const [meetings, setMeetings]                 = useState<any[]>([]);
  const [detailedMeetings, setDetailedMeetings] = useState<any[]>([]);
  const [refreshing, setRefresh]                = useState(false);
  const [saving, setSaving]                     = useState(false);
  
  // Lightbox Modal for handling screen captures
  const [previewImage, setPreviewImage]         = useState<string | null>(null);

  // Replace with dynamic host ID tracking from your Auth context/store
  const currentHostId = localStorage.getItem("userId") || "-1"; 

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [historyRes, detailedRes] = await Promise.all([
        meetingService.getHistory(),
        meetingService.getDetailedHistory(currentHostId)
      ]);
      setMeetings(historyRes.data);
      setDetailedMeetings(detailedRes.data);
    } catch (_) {}
  };

  const onRefresh = async () => {
    setRefresh(true);
    await loadDashboardData();
    setRefresh(false);
  };

  const applyThresholds = async () => {
    if (!meetingId) return;
    setSaving(true);
    try { await meetingService.updateThresholds(meetingId, thresholds); }
    catch (_) {}
    setSaving(false);
  };

  // Human-readable labels and normalization mapping
  const formatEventLabel = (type: string) => {
    const map: Record<string, string> = {
      EYES_CLOSED: "eye closed",
      FACE_MISSING: "face missing",
      PHONE_DETECTED: "phone detected",
    };
    return map[type] || type.toLowerCase().replace("_", " ");
  };

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

        {/* Tab Bar */}
        <View style={{
          flexDirection: "row", backgroundColor: "#1C1C28",
          borderRadius: 12, padding: 4, marginBottom: 20,
        }}>
          {(["detailHistory", "history", "settings"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t} onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                backgroundColor: tab === t ? "#6C63FF" : "transparent",
              }}
            >
              <Text style={{ color: tab === t ? "#fff" : "#9090A8", fontWeight: tab === t ? "700" : "400", fontSize: 12 }}>
                {t === "detailHistory" ? "📋 Event History" :
                 t === "history"       ? "📋 Meeting History" : "⚙️ Settings"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── TAB 1: HISTORY DETAIL ────────────────────────────────────── */}
        {tab === "detailHistory" && (
          detailedMeetings.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
              <Text style={{ color: "#9090A8", fontSize: 14 }}>No detailed events tracked</Text>
            </View>
          ) : (
            detailedMeetings.map((m) => (
              <View key={m.meetingId} style={{
                backgroundColor: "#1C1C28", borderRadius: 14,
                borderWidth: 1, borderColor: "#2A2A3D", padding: 16, marginBottom: 16,
              }}>
                {/* Meeting Header Row */}
                <View style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  borderBottomWidth: 1, borderBottomColor: "#2A2A3D", paddingBottom: 10, marginBottom: 10
                }}>
                  <Text style={{ color: "#E8E8F0", fontWeight: "800", fontSize: 14, flex: 1.5 }}>
                    {m.title}
                  </Text>
                  <Text style={{ color: "#6C63FF", fontWeight: "700", fontSize: 13, flex: 1, textAlign: "center" }}>
                    {m.code}
                  </Text>
                  <Text style={{
                    color: m.status === "ACTIVE" ? "#4ADEAA" : "#FF4D6D",
                    fontWeight: "800", fontSize: 11, flex: 1, textAlign: "right"
                  }}>
                    {m.status}
                  </Text>
                </View>

                {/* Flagged Student Alerts List */}
                {m.flaggedStudents && m.flaggedStudents.length > 0 ? (
                  m.flaggedStudents.map((stud: any) => (
                    <View key={stud.eventId} style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#2A2A3D33"
                    }}>
                      <View style={{ flex: 1.2, paddingLeft: 10 }}>
                        <Text style={{ color: "#E8E8F0", fontSize: 13, fontWeight: "500" }}>{stud.userName}</Text>
                        <Text style={{ color: "#4A4A6A", fontSize: 10 }}>{stud.timestamp}</Text>
                      </View>
                      
                      <Text style={{ color: "#FFB347", fontSize: 12, flex: 1.5, textTransform: "lowercase" }}>
                        {formatEventLabel(stud.eventType)}
                      </Text>

                      {/* <TouchableOpacity 
                        onPress={() => setPreviewImage(stud.screenshotPath)}
                        style={{
                          backgroundColor: "#2A2A3D", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8
                        }}
                      >
                        <Text style={{ color: "#00D4AA", fontSize: 11, fontWeight: "600" }}>View Img</Text>
                      </TouchableOpacity> */}

                      {/* <TouchableOpacity onPress={() => {
                            // Generate the correct absolute URL using our updated service utility
                            const absoluteImgUrl = meetingService.getScreenshotUrl(stud.screenshotPath);
                            setPreviewImage(absoluteImgUrl);
                          }}
                          style={{
                            backgroundColor: "#2A2A3D", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8
                          }}
                        >
                          <Text style={{ color: "#00D4AA", fontSize: 11, fontWeight: "600" }}>View Img</Text>
                        </TouchableOpacity> */}
                        <TouchableOpacity 
  onPress={async () => {
    try {
      // 1. Fetch the binary data directly via your authenticated API instance
      const response = await meetingService.getScreenshotBlob(stud.screenshotPath);
      
      // 2. Convert the raw binary blob directly into a temporary local UI image string
      const localImageTargetUrl = URL.createObjectURL(response.data);
      
      // 3. Set the state to load it into the Modal image view instantly
      setPreviewImage(localImageTargetUrl);
    } catch (error) {
      console.error("Failed to load screenshot from api directly:", error);
    }
  }}
  style={{
    backgroundColor: "#2A2A3D", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8
  }}
>
  <Text style={{ color: "#00D4AA", fontSize: 11, fontWeight: "600" }}>View Img</Text>
</TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "#4A4A6A", fontSize: 12, fontStyle: "italic", textAlign: "center", marginVertical: 6 }}>
                    No infractions flagged during this meeting.
                  </Text>
                )}
              </View>
            ))
          )
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

      {/* IMAGE PREVIEW LIGHTBOX MODAL */}
      <Modal visible={previewImage !== null} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", backgroundColor: "#1C1C28", borderRadius: 16, padding: 16 }}>
            <Text style={{ color: "#E8E8F0", fontWeight: "700", marginBottom: 12, textAlign: "center" }}>Evidence Image</Text>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={{ width: "100%", height: 300, borderRadius: 8 }} resizeMode="contain" />
            ) : (
              <Text style={{ color: "#9090A8", textAlign: "center", marginVertical: 20 }}>No Screenshot Tracked</Text>
            )}
            <TouchableOpacity 
              onPress={() => setPreviewImage(null)}
              style={{ backgroundColor: "#6C63FF", borderRadius: 10, paddingVertical: 12, marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Close View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}