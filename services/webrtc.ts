import { socketService } from "./socket";

const ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type StreamCB = (userId: number, stream: MediaStream | null) => void;

class WebRTCService {
  private peers        = new Map<number, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private meetingId    = "";
  private myUserId     = 0;
  private onStream:    StreamCB | null = null;
  private streamReady  = false;
  private pending:     number[] = []; // peers queued before stream was ready

  init(meetingId: string, myUserId: number, onStream: StreamCB) {
    this.meetingId = meetingId;
    this.myUserId  = myUserId;
    this.onStream  = onStream;
    this._listen();
  }

  private _listen() {
    const sock = socketService.getSocket();
    if (!sock) {
      socketService.onConnect(() => this._listen());
      return;
    }

    sock.off("webrtc:peer_list");
    sock.off("webrtc:offer");
    sock.off("webrtc:answer");
    sock.off("webrtc:ice");
    sock.off("webrtc:peer_left");
    sock.off("webrtc:new_peer"); // new event

    // ── 1. Server sends peer_list to the NEWCOMER ─────────────────────────
    // The newcomer creates offers to everyone already in the room.
    sock.on("webrtc:peer_list", (data: { peers: number[] }) => {
      console.log("[WebRTC] I am new — existing peers:", data.peers);
      (data.peers || []).forEach((peerId: number) => {
        if (peerId === this.myUserId) return;
        if (this.streamReady) this._createOffer(peerId);
        else if (!this.pending.includes(peerId)) this.pending.push(peerId);
      });
    });

    // ── 2. Server notifies EXISTING users that someone new arrived ────────
    // The existing users each create an offer to the newcomer.
    sock.on("webrtc:new_peer", (data: { userId: number }) => {
      console.log("[WebRTC] New peer arrived:", data.userId);
      if (data.userId === this.myUserId) return;
      if (this.streamReady) {
        this._createOffer(data.userId);
      } else {
        if (!this.pending.includes(data.userId)) this.pending.push(data.userId);
      }
    });

    sock.on("webrtc:offer", async (data: { from: number; sdp: string }) => {
      console.log("[WebRTC] offer from", data.from);
      if (this.streamReady) {
        await this._handleOffer(data.from, data.sdp);
      } else {
        const wait = async () => {
          for (let i = 0; i < 50 && !this.streamReady; i++)
            await new Promise(r => setTimeout(r, 200));
          if (this.streamReady) await this._handleOffer(data.from, data.sdp);
        };
        wait();
      }
    });

    sock.on("webrtc:answer", async (data: { from: number; sdp: string }) => {
      const pc = this.peers.get(data.from);
      if (pc) {
        try { await pc.setRemoteDescription({ type: "answer", sdp: data.sdp }); }
        catch (e) { console.warn("[WebRTC] answer:", e); }
      }
    });

    sock.on("webrtc:ice", async (data: { from: number; candidate: any }) => {
      const pc = this.peers.get(data.from);
      if (pc && data.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); }
        catch (_) {}
      }
    });

    sock.on("webrtc:peer_left", (data: { userId: number }) => {
      this._close(data.userId);
    });
  }

  setStream(stream: MediaStream) {
    this.localStream = stream;
    this.streamReady = true;
    console.log("[WebRTC] stream ready — pending:", this.pending);

    this.peers.forEach(pc => {
      stream.getTracks().forEach(track => {
        const s = pc.getSenders().find(s => s.track?.kind === track.kind);
        if (s) s.replaceTrack(track).catch(() => {});
        else pc.addTrack(track, stream);
      });
    });

    const queued = [...this.pending];
    this.pending  = [];
    queued.forEach(id => this._createOffer(id));
  }

  destroy() {
    this.peers.forEach((_, id) => this._close(id));
    this.peers.clear();
    this.localStream = null;
    this.onStream    = null;
    this.streamReady = false;
    this.pending     = [];
    const sock = socketService.getSocket();
    if (sock) {
      sock.off("webrtc:peer_list");
      sock.off("webrtc:offer");
      sock.off("webrtc:answer");
      sock.off("webrtc:ice");
      sock.off("webrtc:peer_left");
      sock.off("webrtc:new_peer");
    }
  }

  private _makePeer(peerId: number): RTCPeerConnection {
    if (this.peers.has(peerId)) { this.peers.get(peerId)!.close(); this.peers.delete(peerId); }

    const pc = new RTCPeerConnection({ iceServers: ICE });
    this.localStream?.getTracks().forEach(t => pc.addTrack(t, this.localStream!));

    pc.onicecandidate = e => {
      if (e.candidate)
        socketService.emit("webrtc:ice", {
          meetingId: this.meetingId, to: peerId,
          from: this.myUserId, candidate: e.candidate.toJSON(),
        });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] peer ${peerId}:`, pc.connectionState);
      if (pc.connectionState === "failed") this._close(peerId);
    };

    const remoteStream = new MediaStream();
    pc.ontrack = e => {
      if (!remoteStream.getTracks().find(t => t.id === e.track.id))
        remoteStream.addTrack(e.track);
      this.onStream?.(peerId, remoteStream);
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  private async _createOffer(peerId: number) {
    console.log("[WebRTC] → offer to", peerId);
    try {
      const pc    = this._makePeer(peerId);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketService.emit("webrtc:offer", {
        meetingId: this.meetingId, to: peerId,
        from: this.myUserId, sdp: pc.localDescription!.sdp,
      });
    } catch (e) { console.error("[WebRTC] createOffer:", e); }
  }

  private async _handleOffer(peerId: number, sdp: string) {
    console.log("[WebRTC] ← offer from", peerId);
    try {
      const pc     = this._makePeer(peerId);
      await pc.setRemoteDescription({ type: "offer", sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emit("webrtc:answer", {
        meetingId: this.meetingId, to: peerId,
        from: this.myUserId, sdp: pc.localDescription!.sdp,
      });
    } catch (e) { console.error("[WebRTC] handleOffer:", e); }
  }

  private _close(peerId: number) {
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
    this.onStream?.(peerId, null);
  }
}

export const webrtcService = new WebRTCService();