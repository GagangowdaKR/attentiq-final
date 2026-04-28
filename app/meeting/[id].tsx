import {
  View, Text, TouchableOpacity, ScrollView,
  Dimensions, TextInput, Platform, FlatList,
} from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMeetingStore, useAuthStore, useAlertStore } from "../../store";
import { meetingService } from "../../services/api";
import { socketService, ChatMessage } from "../../services/socket";
import { webrtcService } from "../../services/webrtc";
import { FrameSender } from "../../services/frame_sender";

const isWeb = Platform.OS === "web";

// ── Avatar color palette ──────────────────────────────────────────────────────
const COLORS = ["#6C63FF","#E91E63","#00BCD4","#4CAF50","#FF9800","#9C27B0","#F44336","#2196F3","#00BFA5","#FF5722"];
const avatarColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];

// ─── VideoTile ────────────────────────────────────────────────────────────────
function VideoTile({ stream, name, isMuted, camOff, isLocal, attentionScore }: {
  stream: MediaStream | null; name: string; isMuted: boolean;
  camOff: boolean; isLocal: boolean; attentionScore: number;
}) {
  const divRef   = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isWeb || !divRef.current) return;
    if (!videoRef.current) {
      const v = document.createElement("video");
      v.autoplay = true; v.playsInline = true; v.muted = isLocal;
      v.style.cssText = `position:absolute;inset:0;width:100%;height:100%;
        object-fit:cover;border-radius:10px;display:none;background:#000;
        transform:${isLocal ? "scaleX(-1)" : "none"};`;
      divRef.current.appendChild(v);
      videoRef.current = v;
    }
    const v = videoRef.current;
    if (stream && !camOff) {
      if (v.srcObject !== stream) { v.srcObject = stream; v.play().catch(() => {}); }
      v.style.display = "block";
    } else {
      v.style.display = "none";
    }
  }, [stream, camOff, isLocal]);

  const scoreColor = attentionScore > 70 ? "#4ADEAA" : attentionScore > 40 ? "#FFB347" : "#FF4D6D";
  const initial    = (name ?? "?").charAt(0).toUpperCase();
  const bg         = avatarColor(name ?? "?");

  if (isWeb) {
    return (
      <div ref={divRef} style={{
        position:"relative", width:"100%", aspectRatio:"16/9",
        backgroundColor:"#161625", borderRadius:10,
        border:`1.5px solid ${isMuted ? "#252535" : "#3D3D5A"}`,
        overflow:"hidden", flexShrink:0,
      }}>
        {(camOff || !stream) && (
          <div style={{
            position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            background:"radial-gradient(circle at 50% 35%,#1E1E32,#0A0A14)",
          }}>
            <div style={{
              width:60,height:60,borderRadius:30,backgroundColor:bg,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:24,color:"#fff",fontWeight:700,
              boxShadow:`0 0 20px ${bg}66`,
            }}>{initial}</div>
            <span style={{color:"#6A6A8A",fontSize:12,marginTop:10,fontFamily:"system-ui"}}>{name}{isLocal?" (You)":""}</span>
          </div>
        )}
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,
          background:"linear-gradient(transparent,rgba(0,0,0,0.8))",
          padding:"18px 8px 6px",display:"flex",alignItems:"center",
          justifyContent:"space-between",fontFamily:"system-ui",
        }}>
          <span style={{color:"#fff",fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"75%"}}>
            {name}{isLocal?" (You)":""}
          </span>
          <span style={{color:scoreColor,fontSize:10,fontWeight:700,background:"rgba(0,0,0,0.55)",padding:"1px 5px",borderRadius:4}}>
            {attentionScore}%
          </span>
        </div>
        {isMuted && (
          <div style={{position:"absolute",top:6,left:6,background:"rgba(255,77,109,0.9)",
            borderRadius:50,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🔇</div>
        )}
        {!isMuted && (
          <div style={{position:"absolute",top:6,right:6,background:"rgba(0,212,170,0.2)",
            border:"1px solid #00D4AA",borderRadius:50,width:24,height:24,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🎙</div>
        )}
      </div>
    );
  }
  return (
    <View style={{aspectRatio:16/9,backgroundColor:"#161625",borderRadius:10,borderWidth:1,borderColor:"#252535",alignItems:"center",justifyContent:"center"}}>
      <View style={{width:50,height:50,borderRadius:25,backgroundColor:bg,alignItems:"center",justifyContent:"center"}}>
        <Text style={{color:"#fff",fontSize:20,fontWeight:"700"}}>{initial}</Text>
      </View>
      <Text style={{color:"#6A6A8A",fontSize:12,marginTop:6}}>{name}</Text>
    </View>
  );
}

// ─── Participants list panel ───────────────────────────────────────────────────
function ParticipantsPanel({ tiles, onClose }: { tiles: any[]; onClose: () => void }) {
  return (
    <View style={{width:220,backgroundColor:"#0F0F1A",borderLeftWidth:1,borderLeftColor:"#1E1E2E"}}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",padding:14,borderBottomWidth:1,borderBottomColor:"#1E1E2E"}}>
        <Text style={{color:"#E8E8F0",fontWeight:"700",fontSize:13}}>👥 Participants ({tiles.length})</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={{color:"#6A6A8A",fontSize:18}}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding:10,gap:6}}>
        {tiles.map((t,i) => (
          <View key={String(t.id)} style={{
            flexDirection:"row",alignItems:"center",gap:10,
            backgroundColor:"#1A1A28",borderRadius:10,padding:10,
            borderWidth:1,borderColor: t.isLocal ? "#6C63FF44" : "#1E1E2E",
          }}>
            <View style={{width:34,height:34,borderRadius:17,backgroundColor:avatarColor(t.name),alignItems:"center",justifyContent:"center"}}>
              <Text style={{color:"#fff",fontWeight:"700",fontSize:14}}>{(t.name??"?").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{color:"#E8E8F0",fontSize:12,fontWeight:"600"}} numberOfLines={1}>
                {t.name}{t.isLocal?" (You)":""}
              </Text>
              {i===0 && <Text style={{color:"#6C63FF",fontSize:9,marginTop:1}}>Host</Text>}
            </View>
            <Text style={{fontSize:13}}>{t.isAudioOn?"🎙":"🔇"}</Text>
            <Text style={{fontSize:13}}>{t.isVideoOn?"📹":"📷"}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────
function ChatPanel({ messages, onSend, myId, onClose }: {
  messages: ChatMessage[]; onSend: (t: string) => void; myId: number; onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);
  const send = () => { const t=input.trim(); if(!t)return; onSend(t); setInput(""); };

  return (
    <View style={{width:260,backgroundColor:"#0F0F1A",borderLeftWidth:1,borderLeftColor:"#1E1E2E",flexDirection:"column"}}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:14,paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#1E1E2E"}}>
        <Text style={{color:"#E8E8F0",fontWeight:"700",fontSize:13}}>💬 Chat</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={{color:"#6A6A8A",fontSize:18}}>✕</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={listRef} data={messages} keyExtractor={m=>m.id} style={{flex:1}}
        contentContainerStyle={{padding:10,gap:8,flexGrow:1}}
        onContentSizeChange={()=>listRef.current?.scrollToEnd({animated:true})}
        ListEmptyComponent={
          <View style={{flex:1,alignItems:"center",justifyContent:"center",paddingTop:50}}>
            <Text style={{fontSize:28}}>💬</Text>
            <Text style={{color:"#4A4A6A",fontSize:12,marginTop:8}}>No messages yet</Text>
          </View>
        }
        renderItem={({item})=>{
          const mine=item.userId===myId;
          return (
            <View style={{alignItems:mine?"flex-end":"flex-start"}}>
              {!mine&&<Text style={{color:"#6C63FF",fontSize:9,fontWeight:"600",marginBottom:2,marginLeft:3}}>{item.userName}</Text>}
              <View style={{backgroundColor:mine?"#6C63FF":"#1A1A28",borderRadius:12,
                borderBottomRightRadius:mine?3:12,borderBottomLeftRadius:mine?12:3,
                paddingHorizontal:10,paddingVertical:7,maxWidth:200,
                borderWidth:mine?0:1,borderColor:"#252535"}}>
                <Text style={{color:"#E8E8F0",fontSize:12,lineHeight:17}}>{item.text}</Text>
              </View>
              <Text style={{color:"#4A4A6A",fontSize:9,marginTop:2,marginHorizontal:3}}>{item.timestamp}</Text>
            </View>
          );
        }}
      />
      <View style={{flexDirection:"row",gap:6,paddingHorizontal:10,paddingVertical:8,borderTopWidth:1,borderTopColor:"#1E1E2E"}}>
        <TextInput
          value={input} onChangeText={setInput} placeholder="Message..."
          placeholderTextColor="#4A4A6A" onSubmitEditing={send} returnKeyType="send" blurOnSubmit={false}
          style={{flex:1,backgroundColor:"#1A1A28",borderRadius:20,paddingHorizontal:12,paddingVertical:8,
            color:"#E8E8F0",fontSize:12,borderWidth:1,borderColor:"#252535",
            ...(isWeb?{outlineStyle:"none"} as any:{})}}
        />
        <TouchableOpacity onPress={send} style={{width:34,height:34,borderRadius:17,
          backgroundColor:input.trim()?"#6C63FF":"#252535",alignItems:"center",justifyContent:"center",alignSelf:"flex-end"}}>
          <Text style={{fontSize:14,color:"#fff"}}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Control button ───────────────────────────────────────────────────────────
function CtrlBtn({ emoji, label, active, onPress, danger, badge }: {
  emoji:string; label:string; active?:boolean; onPress:()=>void; danger?:boolean; badge?:number;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{alignItems:"center",gap:3,minWidth:50}}>
      <View style={{position:"relative"}}>
        <View style={{width:44,height:44,borderRadius:22,
          backgroundColor:danger?"#FF4D6D":active?"#6C63FF":"#1E1E2E",
          borderWidth:danger?0:1,borderColor:active?"#6C63FF":"#2A2A3D",
          alignItems:"center",justifyContent:"center"}}>
          <Text style={{fontSize:18}}>{emoji}</Text>
        </View>
        {!!badge&&badge>0&&(
          <View style={{position:"absolute",top:-2,right:-2,backgroundColor:"#FF4D6D",borderRadius:7,
            minWidth:14,height:14,alignItems:"center",justifyContent:"center"}}>
            <Text style={{color:"#fff",fontSize:8,fontWeight:"700"}}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={{color:active&&!danger?"#C8C8E8":"#6A6A8A",fontSize:9,fontWeight:"600"}}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function MeetingRoomScreen() {
  const router = useRouter();
  const { id: meetingId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { meetingCode, participants, isHost, leaveMeeting } = useMeetingStore();
  const { alerts } = useAlertStore();

  const [muted,         setMuted]        = useState(true);
  const [camOff,        setCamOff]       = useState(true);
  const [showChat,      setShowChat]     = useState(false);
  const [showPeople,    setShowPeople]   = useState(false);
  const [chatMessages,  setChatMessages] = useState<ChatMessage[]>([]);
  const [localStream,   setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStreams,  setRemoteStreams]= useState<Map<number,MediaStream>>(new Map());
  const [unreadChat,    setUnreadChat]   = useState(0);
  const [aiActive,      setAiActive]     = useState(false);
  const [screenW,       setScreenW]      = useState(Dimensions.get("window").width);

  const senderRef      = useRef<FrameSender|null>(null);
  const localStreamRef = useRef<MediaStream|null>(null);

  const recentAlerts = alerts.slice(0,5);

  useEffect(()=>{
    const sub = Dimensions.addEventListener("change",({window})=>setScreenW(window.width));
    return ()=>sub?.remove();
  },[]);

  // Redirect if no user
  useEffect(()=>{ if(!user) router.replace("/(auth)/login"); },[user]);

  // Grid columns
  const total = 1 + participants.length;
  const chatW = (showChat?260:0)+(showPeople?220:0);
  const gridW = screenW - chatW;
  const cols  = total===1?1 : total===2?2 : total<=4?2 : total<=9?3 : 4;

  // ── Tiles ──────────────────────────────────────────────────────────────────
  const tiles = [
    { id:user?.id??0, name:user?.name??"You", isVideoOn:!camOff, isAudioOn:!muted,
      attentionScore:95, isLocal:true, stream:localStream },
    ...participants.map(p=>({...p,isLocal:false,stream:remoteStreams.get(p.id)??null})),
  ];

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async ()=>{
    if(!isWeb) return;
    try {
      const stream = await (navigator as any).mediaDevices.getUserMedia({
        video:{width:{ideal:1280},height:{ideal:720},facingMode:"user"},
        audio:{echoCancellation:true,noiseSuppression:true},
      });
      stream.getAudioTracks().forEach((t:MediaStreamTrack)=>{t.enabled=false;});
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCamOff(false);
      setMuted(true);
      webrtcService.setStream(stream);
      if(user?.id){
        senderRef.current?.stop();
        senderRef.current = new FrameSender(stream,user.id,meetingId);
        senderRef.current.start();
        setAiActive(true);
      }
    } catch(err:any){
      if(err.name==="NotAllowedError"||err.name==="PermissionDeniedError"){
        if(typeof window!=="undefined")
          window.alert("Please allow camera and microphone access in your browser.");
      } else console.warn("[Cam]",err.name,err.message);
    }
  },[user,meetingId]);

  // ── Socket + WebRTC init ──────────────────────────────────────────────────
  useEffect(()=>{
    if(!user?.token||!user?.role||!meetingId) return;

    socketService.connect(user.token, meetingId, {id:user.id,name:user.name,role:user.role});

    webrtcService.init(meetingId, user.id, (peerId,stream)=>{
      setRemoteStreams(prev=>{
        const next = new Map(prev);
        if(stream) next.set(peerId,stream);
        else next.delete(peerId);
        return next;
      });
    });

    const unsubChat = socketService.onChat(msg=>{
      setChatMessages(prev=>[...prev,msg]);
      setUnreadChat(n=>n+1);
    });

    startCamera();

    return ()=>{
      unsubChat();
      senderRef.current?.stop();
      senderRef.current=null;
      webrtcService.destroy();
      localStreamRef.current?.getTracks().forEach((t:MediaStreamTrack)=>t.stop());
      socketService.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{ if(showChat) setUnreadChat(0); },[showChat]);

  // ── Mic toggle ────────────────────────────────────────────────────────────
  const toggleMic = useCallback(()=>{
    if(!localStream){startCamera();return;}
    const next=!muted;
    localStream.getAudioTracks().forEach((t:MediaStreamTrack)=>{t.enabled=next;});
    setMuted(!muted);
    socketService.emitMediaState(meetingId,next,!camOff);
  },[muted,camOff,localStream,meetingId,startCamera]);

  // ── Cam toggle ────────────────────────────────────────────────────────────
  const toggleCam = useCallback(async()=>{
    if(!localStream){await startCamera();return;}
    const nextOff=!camOff;
    localStream.getVideoTracks().forEach((t:MediaStreamTrack)=>{t.enabled=!nextOff;});
    setCamOff(nextOff);
    socketService.emitMediaState(meetingId,!muted,!nextOff);
    if(nextOff){senderRef.current?.stop();setAiActive(false);}
    else{senderRef.current?.start();setAiActive(true);}
  },[camOff,muted,localStream,meetingId,startCamera]);

  const handleSendChat = useCallback((text:string)=>{
    if(!user)return;
    const msg = socketService.sendChat(meetingId,user.id,user.name,text);
    setChatMessages(prev=>[...prev,msg]);
  },[user,meetingId]);

  // ── Leave / End — works on web without Alert.alert ────────────────────────
  const handleLeave = useCallback(()=>{
    const confirmMsg = isHost
      ? "End meeting for everyone?"
      : "Leave this meeting?";

    const doLeave = async()=>{
      try {
        if(isHost) await meetingService.end(meetingId);
        else       await meetingService.leave(meetingId);
      } catch(_){}
      senderRef.current?.stop();
      webrtcService.destroy();
      localStreamRef.current?.getTracks().forEach((t:MediaStreamTrack)=>t.stop());
      leaveMeeting();
      router.replace("/(tabs)/home");
    };

    if(isWeb){
      if(window.confirm(confirmMsg)) doLeave();
    } else {
      const { Alert } = require("react-native");
      Alert.alert(isHost?"End Meeting":"Leave Meeting",confirmMsg,[
        {text:"Cancel",style:"cancel"},
        {text:isHost?"End":"Leave",style:"destructive",onPress:doLeave},
      ]);
    }
  },[isHost,meetingId,leaveMeeting,router]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{flex:1,backgroundColor:"#08080F"}}>

      {/* Header */}
      <View style={{
        flexDirection:"row",alignItems:"center",justifyContent:"space-between",
        paddingHorizontal:16,paddingTop:Platform.OS==="ios"?50:10,paddingBottom:8,
        backgroundColor:"#0D0D1A",borderBottomWidth:1,borderBottomColor:"#1A1A28",
      }}>
        <View>
          <Text style={{color:"#E8E8F0",fontWeight:"800",fontSize:14}}>
            {isHost?"🎙 Hosting":"📹 In Meeting"}
          </Text>
          <Text style={{color:"#6C63FF",fontSize:10,letterSpacing:2,marginTop:1}}>{meetingCode??meetingId}</Text>
        </View>
        <View style={{flexDirection:"row",alignItems:"center",gap:6}}>
          <View style={{flexDirection:"row",alignItems:"center",gap:3,
            backgroundColor:aiActive?"rgba(0,212,170,0.12)":"rgba(255,77,109,0.12)",
            borderRadius:6,borderWidth:1,
            borderColor:aiActive?"rgba(0,212,170,0.4)":"rgba(255,77,109,0.4)",
            paddingHorizontal:7,paddingVertical:2}}>
            <View style={{width:5,height:5,borderRadius:3,backgroundColor:aiActive?"#00D4AA":"#FF4D6D"}}/>
            <Text style={{color:aiActive?"#00D4AA":"#FF4D6D",fontSize:9,fontWeight:"700"}}>
              {aiActive?"AI ON":"AI OFF"}
            </Text>
          </View>
          <View style={{backgroundColor:"#1A1A28",borderRadius:6,borderWidth:1,borderColor:"#252535",
            paddingHorizontal:8,paddingVertical:2,flexDirection:"row",alignItems:"center",gap:3}}>
            <Text style={{color:"#9090A8",fontSize:11}}>👥</Text>
            <Text style={{color:"#E8E8F0",fontSize:11,fontWeight:"700"}}>{tiles.length}</Text>
          </View>
        </View>
      </View>

      {/* Alert strip — host only */}
      {isHost&&recentAlerts.length>0&&(
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{maxHeight:34,backgroundColor:"#0D0D1A"}}
          contentContainerStyle={{gap:6,alignItems:"center",paddingHorizontal:10,paddingVertical:4}}>
          {recentAlerts.map((a,i)=>(
            <View key={`${a.id}-${i}`} style={{
              flexDirection:"row",alignItems:"center",gap:4,
              backgroundColor:(a.eventType==="EYES_CLOSED"?"#FF4D6D":a.eventType==="PHONE_DETECTED"?"#6C63FF":"#FFB347")+"22",
              borderRadius:7,borderWidth:1,
              borderColor:(a.eventType==="EYES_CLOSED"?"#FF4D6D":a.eventType==="PHONE_DETECTED"?"#6C63FF":"#FFB347")+"55",
              paddingHorizontal:8,paddingVertical:3}}>
              <Text style={{fontSize:10}}>
                {a.eventType==="EYES_CLOSED"?"😴":a.eventType==="PHONE_DETECTED"?"📱":"👻"}
              </Text>
              <Text style={{color:a.eventType==="EYES_CLOSED"?"#FF4D6D":a.eventType==="PHONE_DETECTED"?"#6C63FF":"#FFB347",fontSize:10,fontWeight:"600"}}>
                {a.userName}: {a.eventType.replace("_"," ").toLowerCase()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Body */}
      <View style={{flex:1,flexDirection:"row",overflow:"hidden"}}>

        {/* Video grid */}
        {isWeb?(
          <div style={{
            flex:1,display:"grid",
            gridTemplateColumns:`repeat(${cols},1fr)`,
            gap:8,padding:10,
            alignContent:"center",
            overflowY:"auto",
            backgroundColor:"#08080F",
          }}>
            {tiles.map(t=>(
              <VideoTile key={String(t.id)}
                stream={t.stream} name={t.name}
                isMuted={!t.isAudioOn} camOff={!t.isVideoOn}
                isLocal={t.isLocal} attentionScore={t.attentionScore}
              />
            ))}
          </div>
        ):(
          <ScrollView style={{flex:1}}
            contentContainerStyle={{flexDirection:"row",flexWrap:"wrap",gap:6,padding:8}}>
            {tiles.map(t=>(
              <View key={String(t.id)} style={{width:total===1?"100%":"48%"}}>
                <VideoTile stream={t.stream} name={t.name}
                  isMuted={!t.isAudioOn} camOff={!t.isVideoOn}
                  isLocal={t.isLocal} attentionScore={t.attentionScore}/>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Participants panel */}
        {showPeople&&(
          <ParticipantsPanel tiles={tiles} onClose={()=>setShowPeople(false)}/>
        )}

        {/* Chat */}
        {showChat&&(
          <ChatPanel messages={chatMessages} onSend={handleSendChat}
            myId={user?.id??0} onClose={()=>setShowChat(false)}/>
        )}
      </View>

      {/* Control bar */}
      <View style={{
        backgroundColor:"#0D0D1A",borderTopWidth:1,borderTopColor:"#1A1A28",
        paddingVertical:8,paddingBottom:Platform.OS==="ios"?26:8,
        paddingHorizontal:10,flexDirection:"row",justifyContent:"space-around",alignItems:"center",
      }}>
        <CtrlBtn emoji={muted?"🔇":"🎙️"}   label={muted?"Unmute":"Mute"}        active={!muted}    onPress={toggleMic}/>
        <CtrlBtn emoji={camOff?"📷":"📹"}   label={camOff?"Start Cam":"Cam Off"} active={!camOff}   onPress={toggleCam}/>
        <CtrlBtn emoji="👥"                  label="People"                        active={showPeople} onPress={()=>setShowPeople(v=>!v)}/>
        <CtrlBtn emoji="💬"                  label="Chat"                          active={showChat}
          badge={showChat?undefined:unreadChat} onPress={()=>setShowChat(v=>!v)}/>
        <CtrlBtn emoji={isHost?"⛔":"📵"}    label={isHost?"End":"Leave"}          danger onPress={handleLeave}/>
      </View>
    </View>
  );
}