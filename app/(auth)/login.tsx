import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../../services/api";
import { useAuthStore } from "../../store";

const isWeb = Platform.OS === "web";

export default function LoginScreen() {
  const router  = useRouter();
  const setUser = useAuthStore(s => s.setUser);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await authService.login(email.trim(), password);
      const { token, user } = res.data;
      await AsyncStorage.setItem("token", token);
      setUser({ ...user, token });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Invalid email or password");
    } finally { setLoading(false); }
  };

  const inputStyle: any = {
    backgroundColor: "#0D0D1A", borderWidth: 1, borderColor: "#252535",
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11,
    color: "#E8E8F0", fontSize: 14, marginBottom: 12,
    ...(isWeb ? { outlineStyle: "none" } : {}),
  };

  return (
    <LinearGradient colors={["#08080F", "#0D0D1A"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: isWeb ? 400 : "100%" }}>

          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 18,
              backgroundColor: "#6C63FF22", borderWidth: 1, borderColor: "#6C63FF44",
              alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Text style={{ fontSize: 28 }}>👁</Text>
            </View>
            <Text style={{ color: "#E8E8F0", fontSize: 26, fontWeight: "800", letterSpacing: 3 }}>ATTENTIQ</Text>
            <Text style={{ color: "#6C63FF", fontSize: 11, letterSpacing: 4, marginTop: 4 }}>AI ATTENTION MONITORING</Text>
          </View>

          {error !== "" && (
            <View style={{ backgroundColor: "#FF4D6D22", borderRadius: 8, borderWidth: 1, borderColor: "#FF4D6D44", padding: 10, marginBottom: 14 }}>
              <Text style={{ color: "#FF4D6D", fontSize: 12, textAlign: "center" }}>{error}</Text>
            </View>
          )}

          <Text style={{ color: "#6A6A8A", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>EMAIL</Text>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor="#3A3A55"
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            style={inputStyle}
          />

          <Text style={{ color: "#6A6A8A", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>PASSWORD</Text>
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor="#3A3A55"
            secureTextEntry autoCapitalize="none"
            style={[inputStyle, { marginBottom: 20 }]}
          />

          <TouchableOpacity onPress={handleLogin} disabled={loading}
            style={{ backgroundColor: "#6C63FF", borderRadius: 8, paddingVertical: 13, alignItems: "center", opacity: loading ? 0.7 : 1 }}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> :
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 1 }}>SIGN IN</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#6A6A8A", fontSize: 13 }}>
              Don't have an account?{" "}
              <Text style={{ color: "#6C63FF", fontWeight: "600" }}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}