import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../store";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const MenuItem = ({ emoji, label, sub, onPress, danger }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", gap: 14,
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#2A2A3D",
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: danger ? "#FF4D6D22" : "#2A2A3D",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? "#FF4D6D" : "#E8E8F0", fontSize: 14, fontWeight: "600" }}>{label}</Text>
        {sub && <Text style={{ color: "#4A4A6A", fontSize: 12, marginTop: 2 }}>{sub}</Text>}
      </View>
      <Text style={{ color: "#4A4A6A", fontSize: 16 }}>›</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#0A0A0F", "#13131A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>

        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View style={{
            width: 84, height: 84, borderRadius: 42,
            backgroundColor: "#6C63FF44", borderWidth: 2, borderColor: "#6C63FF",
            alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Text style={{ fontSize: 38 }}>{user?.name?.charAt(0).toUpperCase() ?? "?"}</Text>
          </View>
          <Text style={{ color: "#E8E8F0", fontSize: 20, fontWeight: "800" }}>{user?.name}</Text>
          <Text style={{ color: "#9090A8", fontSize: 13, marginTop: 4 }}>{user?.email}</Text>
          <View style={{
            marginTop: 10, backgroundColor: "#6C63FF22", borderRadius: 8,
            borderWidth: 1, borderColor: "#6C63FF44",
            paddingHorizontal: 12, paddingVertical: 4,
          }}>
            <Text style={{ color: "#6C63FF", fontSize: 11, letterSpacing: 2 }}>{user?.role}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={{
          backgroundColor: "#1C1C28", borderRadius: 16,
          borderWidth: 1, borderColor: "#2A2A3D",
          paddingHorizontal: 16, marginBottom: 16,
        }}>
          <MenuItem emoji="🔔" label="Notifications"      sub="Manage alert preferences"  onPress={() => {}} />
          <MenuItem emoji="🔒" label="Change Password"    sub="Update your password"       onPress={() => {}} />
          <MenuItem emoji="📱" label="Connected Devices"  sub="Manage linked devices"      onPress={() => {}} />
          <MenuItem emoji="📊" label="My Attention Stats" sub="View your history"          onPress={() => router.push("/(tabs)/analytics")} />
        </View>

        <View style={{
          backgroundColor: "#1C1C28", borderRadius: 16,
          borderWidth: 1, borderColor: "#2A2A3D",
          paddingHorizontal: 16, marginBottom: 28,
        }}>
          <MenuItem emoji="ℹ️" label="About Attentiq" onPress={() => {}} />
          <MenuItem emoji="🆘" label="Help & Support"  onPress={() => {}} />
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "#FF4D6D22", borderRadius: 14,
            borderWidth: 1, borderColor: "#FF4D6D55",
            paddingVertical: 16, alignItems: "center",
          }}
        >
          <Text style={{ color: "#FF4D6D", fontWeight: "700", fontSize: 14, letterSpacing: 1 }}>
            LOG OUT
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}
