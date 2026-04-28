import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { meetingService } from "../../services/api";
import { useMeetingStore, useAuthStore } from "../../store";

const isWeb = Platform.OS === "web";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setMeeting } = useMeetingStore();
  const isHost = user?.role === "HOST";

  const [joinCode, setJoinCode] = useState("");
  const [title,    setTitle]    = useState("");
  const [joining,  setJoining]  = useState(false);
  const [creating, setCreating] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim()) { Alert.alert("Error", "Enter a meeting code"); return; }
    setJoining(true);
    try {
      const res = await meetingService.join(joinCode.trim().toUpperCase());
      const { meetingId, code } = res.data;
      setMeeting(String(meetingId), code, false);
      router.push(`/meeting/${meetingId}`);
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message || "Invalid meeting code");
    } finally { setJoining(false); }
  };

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert("Error", "Enter a meeting title"); return; }
    setCreating(true);
    try {
      const res = await meetingService.create(title.trim());
      const { meetingId, code } = res.data;
      setMeeting(String(meetingId), code, true);
      router.push(`/meeting/${meetingId}`);
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message || "Could not create meeting");
    } finally { setCreating(false); }
  };

  const inputStyle: any = {
    backgroundColor: "#13131F", borderWidth: 1, borderColor: "#252535",
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11,
    color: "#E8E8F0", fontSize: 14, marginBottom: 12,
    ...(isWeb ? { outlineStyle: "none" } : {}),
  };

  return (
    <LinearGradient colors={["#08080F", "#0D0D1A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}>
        {/* Max-width container for web */}
        <View style={{ width: "100%", maxWidth: isWeb ? 560 : "100%", paddingHorizontal: 24, paddingTop: 52 }}>

          {/* Header */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ color: "#6A6A8A", fontSize: 11, letterSpacing: 3 }}>WELCOME BACK</Text>
            <Text style={{ color: "#E8E8F0", fontSize: 22, fontWeight: "800", marginTop: 4 }}>
              {user?.name?.split(" ")[0]} 👋
            </Text>
          </View>

          {/* Join card */}
          <View style={{ backgroundColor: "#0D0D1A", borderRadius: 14, borderWidth: 1, borderColor: "#252535", padding: 20, marginBottom: 14 }}>
            <Text style={{ color: "#E8E8F0", fontSize: 15, fontWeight: "700", marginBottom: 4 }}>Join a Meeting</Text>
            <Text style={{ color: "#6A6A8A", fontSize: 12, marginBottom: 16 }}>Enter the code shared by your host</Text>
            <TextInput
              value={joinCode}
              onChangeText={t => setJoinCode(t.toUpperCase())}
              placeholder="ATQ-XXXX"
              placeholderTextColor="#3A3A55"
              autoCapitalize="characters"
              style={[inputStyle, { fontSize: 18, letterSpacing: 6, textAlign: "center" }]}
            />
            <TouchableOpacity onPress={handleJoin} disabled={joining}
              style={{ backgroundColor: "#6C63FF", borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
              {joining ? <ActivityIndicator color="#fff" size="small" /> :
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 1 }}>JOIN MEETING</Text>}
            </TouchableOpacity>
          </View>

          {/* Create card — host only */}
          {isHost && (
            <View style={{ backgroundColor: "#0D0D1A", borderRadius: 14, borderWidth: 1, borderColor: "#6C63FF33", padding: 20, marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Text style={{ color: "#E8E8F0", fontSize: 15, fontWeight: "700" }}>New Meeting</Text>
                <View style={{ backgroundColor: "#6C63FF22", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: "#6C63FF", fontSize: 9, fontWeight: "700", letterSpacing: 1 }}>HOST</Text>
                </View>
              </View>
              <Text style={{ color: "#6A6A8A", fontSize: 12, marginBottom: 16 }}>Start with AI attention monitoring</Text>
              <TextInput
                value={title} onChangeText={setTitle}
                placeholder="Meeting title..."
                placeholderTextColor="#3A3A55"
                style={inputStyle}
              />
              <TouchableOpacity onPress={handleCreate} disabled={creating}
                style={{ backgroundColor: "#13131F", borderRadius: 8, borderWidth: 1, borderColor: "#6C63FF", paddingVertical: 12, alignItems: "center" }}>
                {creating ? <ActivityIndicator color="#6C63FF" size="small" /> :
                  <Text style={{ color: "#6C63FF", fontWeight: "700", fontSize: 13, letterSpacing: 1 }}>+ CREATE MEETING</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { label: "Meetings Today", value: "3",   emoji: "📅" },
              { label: "Avg Attention",  value: "78%", emoji: "🎯" },
            ].map(s => (
              <View key={s.label} style={{
                flex: 1, backgroundColor: "#0D0D1A", borderRadius: 12,
                borderWidth: 1, borderColor: "#252535", padding: 16, alignItems: "center",
              }}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</Text>
                <Text style={{ color: "#E8E8F0", fontSize: 18, fontWeight: "800" }}>{s.value}</Text>
                <Text style={{ color: "#6A6A8A", fontSize: 10, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}