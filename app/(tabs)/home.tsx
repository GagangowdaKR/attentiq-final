// import {
//   View, Text, TextInput, TouchableOpacity,
//   ScrollView, Alert, ActivityIndicator, Platform, Dimensions,
// } from "react-native";
// import { useState, useEffect } from "react";
// import { useRouter } from "expo-router";
// import { LinearGradient } from "expo-linear-gradient";
// import { meetingService } from "../../services/api";
// import { useMeetingStore, useAuthStore } from "../../store";

// const isWeb = Platform.OS === "web";
// const { width } = Dimensions.get("window");

// export default function HomeScreen() {
//   const router = useRouter();
//   const { user } = useAuthStore();
//   const { setMeeting } = useMeetingStore();
//   const isHost = user?.role === "HOST";

//   const [joinCode, setJoinCode] = useState("");
//   const [title,    setTitle]    = useState("");
//   const [joining,  setJoining]  = useState(false);
//   const [creating, setCreating] = useState(false);

//   // Dynamic meeting state collectors
//   const [activeMeetings, setActiveMeetings] = useState<any[]>([]);
//   const [endedMeetings, setEndedMeetings]   = useState<any[]>([]);
//   const [loadingLists, setLoadingLists]     = useState(false);

//   useEffect(() => {
//     if (isHost && user?.id) {
//       fetchHostMeetings();
//     }
//   }, [user?.id]);

//   const fetchHostMeetings = async () => {
//     setLoadingLists(true);
//     try {
//       const targetId = user?.id || localStorage.getItem("userId") || 1;
//       const [activeRes, endedRes] = await Promise.all([
//         meetingService.getMeetingsByStatus(targetId, true),
//         meetingService.getMeetingsByStatus(targetId, false)
//       ]);
//       setActiveMeetings(activeRes.data || []);
//       setEndedMeetings(endedRes.data || []);
//     } catch (err) {
//       console.error("Error fetching host categorizations:", err);
//     } finally {
//       setLoadingLists(false);
//     }
//   };

//   const handleJoin = async () => {
//     if (!joinCode.trim()) { Alert.alert("Error", "Enter a meeting code"); return; }
//     setJoining(true);
//     try {
//       const res = await meetingService.join(joinCode.trim().toUpperCase());
//       const { meetingId, code } = res.data;
//       setMeeting(String(meetingId), code, false);
//       router.push(`/meeting/${meetingId}`);
//     } catch (e: any) {
//       Alert.alert("Failed", e?.response?.data?.message || "Invalid meeting code");
//     } finally { setJoining(false); }
//   };

//   const handleCreate = async () => {
//     if (!title.trim()) { Alert.alert("Error", "Enter a meeting title"); return; }
//     setCreating(true);
//     try {
//       const res = await meetingService.create(title.trim());
//       const { meetingId, code } = res.data;
//       setMeeting(String(meetingId), code, true);
//       // Refresh local metrics and push
//       fetchHostMeetings();
//       router.push(`/meeting/${meetingId}`);
//     } catch (e: any) {
//       Alert.alert("Failed", e?.response?.data?.message || "Could not create meeting");
//     } finally { setCreating(false); }
//   };

//   const inputStyle: any = {
//     backgroundColor: "#13131F", borderWidth: 1, borderColor: "#252535",
//     borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11,
//     color: "#E8E8F0", fontSize: 14, marginBottom: 12,
//     ...(isWeb ? { outlineStyle: "none" } : {}),
//   };

//   // Shared glassmorphic container renderer helper
//   const GlassPanel = ({ title, data, type }: { title: string; data: any[]; type: "ACTIVE" | "ENDED" }) => (
//     <View style={{
//       flex: 1, minWidth: isWeb ? 280 : "100%", backgroundColor: type === "ACTIVE" ? "#00FF990B" : "#FF4D6D0B",
//       borderRadius: 16, borderWidth: 1, borderColor: type === "ACTIVE" ? "#00FF9922" : "#FF4D6D22",
//       padding: 20, backdropFilter: "blur(20px)"
//     }}>
//       <Text style={{ color: type === "ACTIVE" ? "#00D4AA" : "#FF4D6D", fontSize: 12, fontWeight: "700", letterSpacing: 2, marginBottom: 16 }}>
//         {title.toUpperCase()} ({data.length})
//       </Text>
//       {loadingLists ? (
//         <ActivityIndicator size="small" color="#6C63FF" />
//       ) : data.length === 0 ? (
//         <Text style={{ color: "#4A4A6A", fontSize: 12, italic: true }}>No records found.</Text>
//       ) : (
//         data.map((m, idx) => (
//           <View key={m.id || idx} style={{
//             backgroundColor: "#0D0D1A66", borderRadius: 10, borderWidth: 1,
//             borderColor: type === "ACTIVE" ? "#00FF9911" : "#FF4D6D11",
//             padding: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center"
//           }}>
//             <Text style={{ color: "#E8E8F0", fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 }} numberOfLines={1}>
//               {m.title}
//             </Text>
//             <View style={{ backgroundColor: "#00000044", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
//               <Text style={{ color: type === "ACTIVE" ? "#00D4AA" : "#9090A8", fontSize: 11, fontWeight: "700", fontFamily: "monospace" }}>
//                 {m.code}
//               </Text>
//             </View>
//           </View>
//         ))
//       )}
//     </View>
//   );

//   return (
//     <LinearGradient colors={["#08080F", "#0D0D1A"]} style={{ flex: 1 }}>
//       <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 40, paddingTop: 52 }}>
        
//         {/* Dynamic Multi-Column Master Layout Shell */}
//         <View style={{
//           width: "100%",
//           maxWidth: isHost && isWeb ? 1200 : 560,
//           paddingHorizontal: 24,
//           flexDirection: isHost && isWeb ? "row" : "column",
//           gap: 24,
//           alignItems: "stretch",
//         }}>

//           {/* ─── LEFT SIDE PANEL: ACTIVE MEETINGS (HOST ONLY) ────────────────── */}
//           {isHost && (
//             <View style={{ flex: isWeb ? 1 : undefined, order: isWeb ? 1 : 2 }}>
//               <GlassPanel title="Active Session Streams" data={activeMeetings} type="ACTIVE" />
//             </View>
//           )}

//           {/* ─── MIDDLE CORE UTILITY HUB ────────────────────────────────────── */}
//           <View style={{ flex: isWeb && isHost ? 1.3 : undefined, order: 1 }}>
            
//             {/* Header Content */}
//             <View style={{ marginBottom: 24 }}>
//               <Text style={{ color: "#6A6A8A", fontSize: 11, letterSpacing: 3 }}>WELCOME BACK</Text>
//               <Text style={{ color: "#E8E8F0", fontSize: 24, fontWeight: "800", marginTop: 4 }}>
//                 {user?.name?.split(" ")[0] || "User"} 👋
//               </Text>
//             </View>

//             {/* Join card wrapper */}
//             <View style={{ backgroundColor: "#0D0D1A", borderRadius: 14, borderWidth: 1, borderColor: "#252535", padding: 20, marginBottom: 14 }}>
//               <Text style={{ color: "#E8E8F0", fontSize: 15, fontWeight: "700", marginBottom: 4 }}>Join a Meeting</Text>
//               <Text style={{ color: "#6A6A8A", fontSize: 12, marginBottom: 16 }}>Enter the code shared by your host</Text>
//               <TextInput
//                 value={joinCode}
//                 onChangeText={t => setJoinCode(t.toUpperCase())}
//                 placeholder="ATQ-XXXX"
//                 placeholderTextColor="#3A3A55"
//                 autoCapitalize="characters"
//                 style={[inputStyle, { fontSize: 18, letterSpacing: 6, textAlign: "center" }]}
//               />
//               <TouchableOpacity onPress={handleJoin} disabled={joining}
//                 style={{ backgroundColor: "#6C63FF", borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
//                 {joining ? <ActivityIndicator color="#fff" size="small" /> :
//                   <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 1 }}>JOIN MEETING</Text>}
//               </TouchableOpacity>
//             </View>

//             {/* Create card — Host selection portal */}
//             {isHost && (
//               <View style={{ backgroundColor: "#0D0D1A", borderRadius: 14, borderWidth: 1, borderColor: "#6C63FF33", padding: 20 }}>
//                 <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
//                   <Text style={{ color: "#E8E8F0", fontSize: 15, fontWeight: "700" }}>New Meeting</Text>
//                   <View style={{ backgroundColor: "#6C63FF22", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
//                     <Text style={{ color: "#6C63FF", fontSize: 9, fontWeight: "700", letterSpacing: 1 }}>HOST</Text>
//                   </View>
//                 </View>
//                 <Text style={{ color: "#6A6A8A", fontSize: 12, marginBottom: 16 }}>Start with AI attention monitoring</Text>
//                 <TextInput
//                   value={title} onChangeText={setTitle}
//                   placeholder="Meeting title..."
//                   placeholderTextColor="#3A3A55"
//                   style={inputStyle}
//                 />
//                 <TouchableOpacity onPress={handleCreate} disabled={creating}
//                   style={{ backgroundColor: "#13131F", borderRadius: 8, borderWidth: 1, borderColor: "#6C63FF", paddingVertical: 12, alignItems: "center" }}>
//                   {creating ? <ActivityIndicator color="#6C63FF" size="small" /> :
//                     <Text style={{ color: "#6C63FF", fontWeight: "700", fontSize: 13, letterSpacing: 1 }}>+ CREATE MEETING</Text>}
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>

//           {/* ─── RIGHT SIDE PANEL: ENDED MEETINGS (HOST ONLY) ────────────────── */}
//           {isHost && (
//             <View style={{ flex: isWeb ? 1 : undefined, order: 3 }}>
//               <GlassPanel title="Ended Sessions" data={endedMeetings} type="ENDED" />
//             </View>
//           )}

//         </View>
//       </ScrollView>
//     </LinearGradient>
//   );
// }


import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform, Dimensions,
} from "react-native";
import { useState, useEffect } from "react";
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

  // Host specific states
  const [activeMeetings, setActiveMeetings] = useState<any[]>([]);
  const [endedMeetings, setEndedMeetings]   = useState<any[]>([]);
  const [loadingLists, setLoadingLists]     = useState(false);

  useEffect(() => {
    if (isHost && user?.id) {
      fetchHostMeetings();
    }
  }, [user?.id]);

  const fetchHostMeetings = async () => {
    setLoadingLists(true);
    try {
      const targetId = user?.id || localStorage.getItem("hostId") || 1;
      const [activeRes, endedRes] = await Promise.all([
        meetingService.getMeetingsByStatus(targetId, true),
        meetingService.getMeetingsByStatus(targetId, false)
      ]);
      setActiveMeetings(activeRes.data || []);
      setEndedMeetings(endedRes.data || []);
    } catch (err) {
      console.error("Error fetching host categorizations:", err);
    } finally {
      setLoadingLists(false);
    }
  };

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
      fetchHostMeetings();
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

  // Shared glassmorphic side panel layout component (Used for Host Meetings & Participant Rules)
  const GlassPanel = ({ title, items, renderCustom, type }: { title: string; items?: any[]; renderCustom?: () => React.ReactNode; type: "ACTIVE" | "ENDED" }) => (
    <View style={{
      flex: 1, minWidth: isWeb ? 290 : "100%", backgroundColor: type === "ACTIVE" ? "#00FF990B" : "#FF4D6D0B",
      borderRadius: 16, borderWidth: 1, borderColor: type === "ACTIVE" ? "#00FF9922" : "#FF4D6D22",
      padding: 20,
    }}>
      <Text style={{ color: type === "ACTIVE" ? "#00D4AA" : "#FF4D6D", fontSize: 12, fontWeight: "700", letterSpacing: 2, marginBottom: 16 }}>
        {title.toUpperCase()}
      </Text>
      {renderCustom ? renderCustom() : items?.map((item, idx) => (
        <View key={idx} style={{
          backgroundColor: "#0D0D1A66", borderRadius: 10, borderWidth: 1,
          borderColor: type === "ACTIVE" ? "#00FF9911" : "#FF4D6D11", padding: 12, marginBottom: 8
        }}>
          {item}
        </View>
      ))}
    </View>
  );

  return (
    <LinearGradient colors={["#08080F", "#0D0D1A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 40, paddingTop: 52 }}>
        
        <View style={{
          width: "100%",
          maxWidth: isWeb ? 1200 : 560,
          paddingHorizontal: 24,
          flexDirection: isWeb ? "row" : "column",
          gap: 24,
          alignItems: "stretch",
        }}>

          {/* ─── LEFT SIDE COLUMN ────────────────────────────────────────── */}
          {/* HOST: Active Meetings | PARTICIPANT: Do's Rules */}
          <View style={{ flex: isWeb ? 1 : undefined, order: isWeb ? 1 : 2 }}>
            {isHost ? (
              <GlassPanel 
                title={`Active Session Streams (${activeMeetings.length})`} 
                type="ACTIVE" 
                renderCustom={() => (
                  loadingLists ? <ActivityIndicator size="small" color="#6C63FF" /> :
                  activeMeetings.length === 0 ? <Text style={{ color: "#4A4A6A", fontSize: 12 }}>No records found.</Text> :
                  activeMeetings.map((m, idx) => (
                    <View key={m.id || idx} style={{
                      backgroundColor: "#0D0D1A66", borderRadius: 10, borderWidth: 1, borderColor: "#00FF9911",
                      padding: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <Text style={{ color: "#E8E8F0", fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 }} numberOfLines={1}>{m.title}</Text>
                      <View style={{ backgroundColor: "#00000044", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: "#00D4AA", fontSize: 11, fontWeight: "700", fontFamily: "monospace" }}>{m.code}</Text>
                      </View>
                    </View>
                  ))
                )}
              />
            ) : (
              <GlassPanel 
                title="Attention Do's" 
                type="ACTIVE"
                items={[
                  <Text style={{ color: "#E8E8F0", fontSize: 13, lineHeight: 18 }}>🟢 <Text style={{ fontWeight: "700" }}>Face visible:</Text> Keep your full face focused directly inside the webcam frame at all times.</Text>,
                  <Text style={{ color: "#E8E8F0", fontSize: 13, lineHeight: 18 }}>🟢 <Text style={{ fontWeight: "700" }}>Stay focused:</Text> Ensure your eyes remain open and active to prevent sleep detection alerts.</Text>,
                  <Text style={{ color: "#E8E8F0", fontSize: 13, lineHeight: 18 }}>🟢 <Text style={{ fontWeight: "700" }}>Device compliance:</Text> Keep your hands free and desk workspace completely clear of devices.</Text>
                ]}
              />
            )}
          </View>

          {/* ─── MIDDLE MAIN CORE PANEL (Welcome & Actions Hub) ──────────── */}
          <View style={{ flex: isWeb ? 1.2 : undefined, order: 1 }}>
            
            {/* Greeting Display Header */}
            {/* Dynamic Welcome Header */}
            <View style={{ marginBottom: 28 }}>
              <Text style={{ color: "#6A6A8A", fontSize: 13, fontWeight: "600", letterSpacing: 1 }}>
                Welcome {isHost ? "Host" : "Participant"},
              </Text>
              <Text style={{ color: "#E8E8F0", fontSize: 26, fontWeight: "800", marginTop: 4 }}>
                {user?.name || "User"}
              </Text>
            </View>

            {/* Join meeting control wrapper box */}
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

            {/* Create meeting control container — Host view layer mapping exclusively */}
            {isHost && (
              <View style={{ backgroundColor: "#0D0D1A", borderRadius: 14, borderWidth: 1, borderColor: "#6C63FF33", padding: 20 }}>
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
          </View>

          {/* ─── RIGHT SIDE COLUMN ───────────────────────────────────────── */}
          {/* HOST: Ended Meetings | PARTICIPANT: Don'ts Rules */}
          <View style={{ flex: isWeb ? 1 : undefined, order: 3 }}>
            {isHost ? (
              <GlassPanel 
                title={`Ended Sessions (${endedMeetings.length})`} 
                type="ENDED" 
                renderCustom={() => (
                  loadingLists ? <ActivityIndicator size="small" color="#6C63FF" /> :
                  endedMeetings.length === 0 ? <Text style={{ color: "#4A4A6A", fontSize: 12 }}>No records found.</Text> :
                  endedMeetings.map((m, idx) => (
                    <View key={m.id || idx} style={{
                      backgroundColor: "#0D0D1A66", borderRadius: 10, borderWidth: 1, borderColor: "#FF4D6D11",
                      padding: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <Text style={{ color: "#E8E8F0", fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 }} numberOfLines={1}>{m.title}</Text>
                      <View style={{ backgroundColor: "#00000044", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: "#9090A8", fontSize: 11, fontWeight: "700", fontFamily: "monospace" }}>{m.code}</Text>
                      </View>
                    </View>
                  ))
                )}
              />
            ) : (
              <GlassPanel 
                title="Attention Don'ts" 
                type="ENDED"
                items={[
                  <Text style={{ color: "#E8E8F0", fontSize: 13, lineHeight: 18 }}>🔴 <Text style={{ fontWeight: "700" }}>Out of camera:</Text> Do not move away from your workspace or shift out of the lens field of view.</Text>,
                  <Text style={{ color: "#E8E8F0", fontSize: 13, lineHeight: 18 }}>🔴 <Text style={{ fontWeight: "700" }}>Close eyes:</Text> Avoid slouching, looking down continuously, or closing your eyes during logs.</Text>,
                  <Text style={{ color: "#E8E8F0", fontSize: 13, lineHeight: 18 }}>🔴 <Text style={{ fontWeight: "700" }}>Using phone:</Text> Do not pull out or look at your smartphone during an active tracking run.</Text>
                ]}
              />
            )}
          </View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}