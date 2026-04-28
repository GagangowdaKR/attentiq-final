import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { analyticsService } from "../../services/api";
import { ATTENTION_BANDS } from "../../constants";

const { width } = Dimensions.get("window");
const CHART_W = width - 48;

// Simple bar
function Bar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={{ height: 8, backgroundColor: "#2A2A3D", borderRadius: 4, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

// Sparkline bars
function SparkLine({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const bw = (CHART_W - 32) / data.length - 3;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 60, gap: 3, paddingHorizontal: 16 }}>
      {data.map((v, i) => (
        <View key={i} style={{
          width: bw, borderRadius: 3,
          height: Math.max(4, (v / max) * 60),
          backgroundColor: color,
          opacity: 0.35 + 0.65 * (i / data.length),
        }} />
      ))}
    </View>
  );
}

// Score ring
function ScoreRing({ score }: { score: number }) {
  const band = score >= 80 ? ATTENTION_BANDS.HIGH
             : score >= 50 ? ATTENTION_BANDS.MEDIUM
             : ATTENTION_BANDS.LOW;
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 3, borderColor: band.color,
        backgroundColor: band.color + "18",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ color: band.color, fontSize: 20, fontWeight: "800" }}>{score}%</Text>
      </View>
      <Text style={{ color: band.color, fontSize: 11, fontWeight: "600", marginTop: 6 }}>
        {band.label}
      </Text>
    </View>
  );
}

// Mock fallback data
const MOCK = {
  totalMeetings: 14,
  totalParticipants: 287,
  avgAttentionScore: 74,
  topAlerts: [
    { type: "EYES_CLOSED",    count: 23 },
    { type: "FACE_MISSING",   count: 11 },
    { type: "PHONE_DETECTED", count: 8  },
  ],
  weeklyAttention: [71, 68, 74, 80, 75, 72, 74],
  recentMeetings: [
    { id: "m1", title: "Sprint Review",   date: "Mar 10", participants: 12, avgAttention: 82, alerts: 2  },
    { id: "m2", title: "Design Sync",     date: "Mar 9",  participants: 8,  avgAttention: 65, alerts: 7  },
    { id: "m3", title: "Daily Standup",   date: "Mar 8",  participants: 6,  avgAttention: 90, alerts: 0  },
    { id: "m4", title: "Quarterly Review",date: "Mar 7",  participants: 34, avgAttention: 58, alerts: 18 },
  ],
};

const ALERT_META: Record<string, { color: string; label: string }> = {
  EYES_CLOSED:    { color: "#FF4D6D", label: "😴 Eyes Closed"    },
  FACE_MISSING:   { color: "#FFB347", label: "👻 Face Missing"   },
  PHONE_DETECTED: { color: "#6C63FF", label: "📱 Phone Detected" },
};

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function AnalyticsScreen() {
  const [loading, setLoading]     = useState(true);
  const [overview, setOverview]   = useState<any>(null);
  const [selected, setSelected]   = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getHostOverview();
      setOverview(res.data);
    } catch (_) {
      setOverview(MOCK);
    }
    setLoading(false);
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#6C63FF" />
      <Text style={{ color: "#9090A8", marginTop: 16 }}>Loading analytics...</Text>
    </View>
  );

  const totalAlerts = overview.topAlerts.reduce((s: number, a: any) => s + a.count, 0);

  return (
    <LinearGradient colors={["#0A0A0F", "#13131A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>

        {/* Header */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ color: "#9090A8", fontSize: 11, letterSpacing: 3 }}>INSIGHTS</Text>
          <Text style={{ color: "#E8E8F0", fontSize: 26, fontWeight: "800", marginTop: 4 }}>Analytics</Text>
        </View>

        {/* KPI Row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Meetings",      value: overview.totalMeetings,        emoji: "📅" },
            { label: "Participants",  value: overview.totalParticipants,     emoji: "👥" },
            { label: "Avg Attention", value: `${overview.avgAttentionScore}%`, emoji: "🎯" },
          ].map((k) => (
            <View key={k.label} style={{
              flex: 1, backgroundColor: "#1C1C28", borderRadius: 14,
              borderWidth: 1, borderColor: "#2A2A3D", padding: 14, alignItems: "center",
            }}>
              <Text style={{ fontSize: 18, marginBottom: 6 }}>{k.emoji}</Text>
              <Text style={{ color: "#E8E8F0", fontSize: 18, fontWeight: "800" }}>{k.value}</Text>
              <Text style={{ color: "#9090A8", fontSize: 10, marginTop: 2, textAlign: "center" }}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Attention Chart */}
        <View style={{
          backgroundColor: "#1C1C28", borderRadius: 16,
          borderWidth: 1, borderColor: "#2A2A3D",
          paddingTop: 20, paddingBottom: 16, marginBottom: 20,
        }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 16, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#E8E8F0", fontWeight: "700" }}>Weekly Attention</Text>
            <Text style={{ color: "#6C63FF", fontWeight: "700" }}>
              Avg {Math.round(overview.weeklyAttention.reduce((a: number, b: number) => a + b, 0) / 7)}%
            </Text>
          </View>
          <SparkLine data={overview.weeklyAttention} color="#6C63FF" />
          <View style={{ flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginTop: 8 }}>
            {DAYS.map((d, i) => <Text key={`day-${i}`} style={{ color: "#4A4A6A", fontSize: 10 }}>{d}</Text>)}
          </View>
        </View>

        {/* Alert Breakdown */}
        <View style={{
          backgroundColor: "#1C1C28", borderRadius: 16,
          borderWidth: 1, borderColor: "#2A2A3D", padding: 20, marginBottom: 20,
        }}>
          <Text style={{ color: "#E8E8F0", fontWeight: "700", marginBottom: 16 }}>Alert Breakdown</Text>
          {overview.topAlerts.map((a: any) => {
            const m = ALERT_META[a.type] ?? { color: "#9090A8", label: a.type };
            return (
              <View key={a.type} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ color: "#E8E8F0", fontSize: 13 }}>{m.label}</Text>
                  <Text style={{ color: m.color, fontWeight: "700" }}>{a.count}</Text>
                </View>
                <Bar value={a.count} max={totalAlerts} color={m.color} />
              </View>
            );
          })}
        </View>

        {/* Recent Meetings */}
        <Text style={{ color: "#9090A8", fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>
          RECENT MEETINGS
        </Text>
        {overview.recentMeetings.map((m: any) => (
          <TouchableOpacity
            key={m.id}
            onPress={() => setSelected(selected === m.id ? null : m.id)}
            style={{
              backgroundColor: "#1C1C28", borderRadius: 14,
              borderWidth: 1, borderColor: selected === m.id ? "#6C63FF55" : "#2A2A3D",
              padding: 16, marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#E8E8F0", fontWeight: "700" }}>{m.title}</Text>
                <Text style={{ color: "#4A4A6A", fontSize: 11, marginTop: 2 }}>{m.date}</Text>
              </View>
              <ScoreRing score={m.avgAttention} />
            </View>

            {selected === m.id && (
              <View style={{ marginTop: 16, gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <Text style={{ color: "#9090A8", fontSize: 12 }}>👥 {m.participants} participants</Text>
                  <Text style={{ color: "#9090A8", fontSize: 12 }}>⚠️ {m.alerts} alerts</Text>
                </View>
                <View>
                  <Text style={{ color: "#9090A8", fontSize: 11, marginBottom: 6 }}>Attention Score</Text>
                  <Bar
                    value={m.avgAttention}
                    color={m.avgAttention >= 80 ? "#4ADEAA" : m.avgAttention >= 50 ? "#FFB347" : "#FF4D6D"}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

      </ScrollView>
    </LinearGradient>
  );
}