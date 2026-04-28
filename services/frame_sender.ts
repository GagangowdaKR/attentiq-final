// ─── attentiq-final/services/frame_sender.ts ─────────────────────────────────
/**
 * FrameSender
 * -----------
 * Captures a JPEG snapshot from the local MediaStream every INTERVAL ms
 * and POSTs it to the AI service at POST /analyze.
 *
 * Only runs on web (MediaStream + Canvas API required).
 * Stops automatically when stop() is called or the stream ends.
 *
 * Usage in [id].tsx:
 *
 *   import { FrameSender } from "../../services/frame_sender";
 *
 *   // start after camera is ready:
 *   const sender = new FrameSender(localStream, userId, meetingId);
 *   sender.start();
 *
 *   // stop when leaving:
 *   sender.stop();
 */

import { AI_SERVICE_URL } from "../constants";

const ANALYZE_URL  = `${AI_SERVICE_URL}/analyze`;
const INTERVAL_MS  = 5000;   // send a frame every 5 seconds
const JPEG_QUALITY = 0.6;    // canvas toBlob quality

export class FrameSender {
  private stream:    MediaStream;
  private userId:    number;
  private meetingId: string;
  private timer:     ReturnType<typeof setInterval> | null = null;
  private canvas:    HTMLCanvasElement;
  private ctx:       CanvasRenderingContext2D;
  private video:     HTMLVideoElement;
  private _active    = false;

  constructor(stream: MediaStream, userId: number, meetingId: string) {
    this.stream    = stream;
    this.userId    = userId;
    this.meetingId = meetingId;

    // Off-screen canvas to capture frames
    this.canvas = document.createElement("canvas");
    this.canvas.width  = 640;
    this.canvas.height = 480;
    this.ctx = this.canvas.getContext("2d")!;

    // Off-screen video to draw from
    this.video = document.createElement("video");
    this.video.srcObject = stream;
    this.video.muted     = true;
    this.video.playsInline = true;
    this.video.play().catch(() => {});
  }

  start(): void {
    if (this._active) return;
    this._active = true;
    // Small delay to let the video element warm up
    setTimeout(() => {
      this.timer = setInterval(() => this._captureAndSend(), INTERVAL_MS);
    }, 2000);
    console.log("[AI] FrameSender started — every", INTERVAL_MS / 1000, "s");
  }

  stop(): void {
    this._active = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.video.srcObject = null;
    console.log("[AI] FrameSender stopped");
  }

  private async _captureAndSend(): Promise<void> {
    if (!this._active) return;

    // Don't send if video isn't playing (e.g. camera turned off)
    if (this.video.readyState < 2) return;

    try {
      // Draw current video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Convert to base64 JPEG
      const dataUrl  = this.canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      // Strip the data-URI prefix — AI server accepts both, but smaller payload
      const base64   = dataUrl.split(",")[1];

      const payload = {
        userId:    this.userId,
        meetingId: this.meetingId,
        frame:     base64,
      };

      const resp = await fetch(ANALYZE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (resp.ok) {
        const result = await resp.json();
        if (result.events && result.events.length > 0) {
          console.log("[AI] Events detected:", result.events,
                      "| EAR:", result.ear,
                      "| Pitch:", result.pitch, "Yaw:", result.yaw);
        }
      } else {
        console.warn("[AI] /analyze returned", resp.status);
      }
    } catch (err) {
      // AI service down — silent fail, don't crash the meeting
      console.warn("[AI] Frame send failed:", err);
    }
  }
}