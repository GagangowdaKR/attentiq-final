import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Platform,
} from "react-native";
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../../services/api";
import { useAuthStore } from "../../store";

const isWeb = Platform.OS === "web";

interface FP { label:string; value:string; onChange:(v:string)=>void; placeholder:string; secure?:boolean; keyboard?:"default"|"email-address"; next?:any; }
function Field({label,value,onChange,placeholder,secure,keyboard,next}:FP) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: "#6A6A8A", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#3A3A55" secureTextEntry={secure}
        keyboardType={keyboard??"default"} autoCapitalize="none" autoCorrect={false}
        returnKeyType={next?"next":"done"} onSubmitEditing={()=>next?.current?.focus()}
        style={{
          backgroundColor:"#0D0D1A",borderWidth:1,borderColor:"#252535",
          borderRadius:8,paddingHorizontal:14,paddingVertical:11,
          color:"#E8E8F0",fontSize:14,
          ...(isWeb?{outlineStyle:"none"} as any:{}),
        }}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const router  = useRouter();
  const setUser = useAuthStore(s => s.setUser);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [role,     setRole]     = useState<"HOST"|"PARTICIPANT">("PARTICIPANT");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const emailRef   = useRef<any>(null);
  const passRef    = useRef<any>(null);
  const confirmRef = useRef<any>(null);

  const handleRegister = async () => {
    if (!name||!email||!password) { setError("Please fill in all fields"); return; }
    if (password !== confirm)     { setError("Passwords do not match"); return; }
    if (password.length < 6)      { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await authService.register(name.trim(), email.trim(), password, role);
      const { token, user } = res.data;
      await AsyncStorage.setItem("token", token);
      setUser({ ...user, token });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={["#08080F","#0D0D1A"]} style={{flex:1}}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{alignItems:"center",paddingVertical:40,paddingHorizontal:24}}>
        <View style={{width:"100%",maxWidth:isWeb?420:"100%"}}>

          <TouchableOpacity onPress={()=>router.back()} style={{marginBottom:28}}>
            <Text style={{color:"#6C63FF",fontSize:13}}>← Back</Text>
          </TouchableOpacity>

          <Text style={{color:"#E8E8F0",fontSize:22,fontWeight:"800",marginBottom:4}}>Create Account</Text>
          <Text style={{color:"#6A6A8A",fontSize:13,marginBottom:28}}>Join Attentiq as a host or participant</Text>

          {error!==""&&(
            <View style={{backgroundColor:"#FF4D6D22",borderRadius:8,borderWidth:1,borderColor:"#FF4D6D44",padding:10,marginBottom:16}}>
              <Text style={{color:"#FF4D6D",fontSize:12,textAlign:"center"}}>{error}</Text>
            </View>
          )}

          <Field label="FULL NAME"        value={name}     onChange={setName}     placeholder="John Doe"         next={emailRef}/>
          <Field label="EMAIL"            value={email}    onChange={setEmail}    placeholder="you@example.com"  keyboard="email-address" next={passRef}/>
          <Field label="PASSWORD"         value={password} onChange={setPassword} placeholder="Min 6 characters" secure next={confirmRef}/>
          <Field label="CONFIRM PASSWORD" value={confirm}  onChange={setConfirm}  placeholder="Repeat password"  secure/>

          <Text style={{color:"#6A6A8A",fontSize:10,letterSpacing:2,marginBottom:10,marginTop:4}}>SELECT ROLE</Text>
          <View style={{flexDirection:"row",gap:10,marginBottom:24}}>
            {(["PARTICIPANT","HOST"] as const).map(r=>(
              <TouchableOpacity key={r} onPress={()=>setRole(r)} style={{
                flex:1,paddingVertical:12,borderRadius:8,alignItems:"center",
                backgroundColor:role===r?"#6C63FF":"#0D0D1A",
                borderWidth:1.5,borderColor:role===r?"#6C63FF":"#252535",
              }}>
                <Text style={{fontSize:16,marginBottom:3}}>{r==="HOST"?"🎙":"👤"}</Text>
                <Text style={{color:role===r?"#fff":"#6A6A8A",fontWeight:"700",fontSize:12}}>{r==="HOST"?"Host":"Participant"}</Text>
                <Text style={{color:role===r?"#ffffff88":"#3A3A55",fontSize:10,marginTop:2}}>
                  {r==="HOST"?"Create meetings":"Join meetings"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleRegister} disabled={loading}
            style={{backgroundColor:"#6C63FF",borderRadius:8,paddingVertical:13,alignItems:"center",opacity:loading?0.7:1}}>
            {loading?<ActivityIndicator color="#fff" size="small"/>:
              <Text style={{color:"#fff",fontWeight:"700",fontSize:14,letterSpacing:1}}>CREATE ACCOUNT</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={()=>router.back()} style={{marginTop:18,alignItems:"center"}}>
            <Text style={{color:"#6A6A8A",fontSize:13}}>
              Already have an account?{" "}
              <Text style={{color:"#6C63FF",fontWeight:"600"}}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}