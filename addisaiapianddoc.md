sk_427b5438-08b0-4fa2-8a0b-86574c085ffc_d2d562dc95874ecc14b9832ad28a07d006edffe8a8bd052874c5010c4d71eb19

Realtime API
Low-latency, bidirectional voice conversations via WebSockets.

The Realtime API enables fluid, natural voice conversations. It uses WebSockets to stream audio bi-directionally, achieving response times under 300ms.

It is powered by አሌፍ-1.2-realtime-audio, allowing for natural interruptions and back-channeling.

Endpoint
WSS
wss://relay.addisassistant.com/ws
Authentication
For browser and mobile clients, pass your API key as a query parameter:


wss://relay.addisassistant.com/ws?apiKey=YOUR_API_KEY
Industry Use Cases
Our Realtime model is already deployed across key African sectors. You can test these specific Agents in our Playground.

Telecom Assistant

Automated customer support for balance checks, package purchasing, and troubleshooting in Amharic.

Ride Hailing

Voice-first driver negotiation and location finding. "Where are you?" "I'm at Bole near the bank."

Farmer's Assistant

Agricultural advisory for weather updates, crop disease diagnosis, and market prices in local dialects.

Audio Format Requirements
Critical: Audio Encoding

The API expects 16-bit Signed Integer PCM (PCM16) audio.

Developer Warning: The standard browser AudioContext returns 32-bit Float data (-1.0 to 1.0) by default. If you send this directly, it will sound like static noise. You must convert Float32 to Int16 before sending it over the WebSocket.

Property	Value
Encoding	PCM 16-bit (Little Endian)
Client Upload	audio/pcm;rate=16000 (Mono)
Server Audio Output	PCM16 Mono, typically 24,000Hz
Integration Guide
Browser Implementation (JavaScript)
This example establishes a connection, captures microphone audio, converts it from Float32 to PCM16, and handles the audio stream.

JavaScript (Browser)
Python

const API_KEY = "sk_YOUR_KEY";
const WS_URL = `wss://relay.addisassistant.com/ws?apiKey=${encodeURIComponent(API_KEY)}`;
const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;
let socket;
let inputContext;
let outputContext;
let stream;
let source;
let processor;
let canStreamAudio = false;
let nextStartTime = 0;
async function startRealtime() {
  // Output context for AI playback
  outputContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: OUTPUT_RATE,
  });
  await outputContext.resume();
  nextStartTime = outputContext.currentTime;
  // Input context for mic capture
  inputContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: INPUT_RATE,
  });
  await inputContext.resume();
  stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  source = inputContext.createMediaStreamSource(stream);
  processor = inputContext.createScriptProcessor(2048, 1, 1);
  // Connect processor through a muted gain so callback keeps firing without mic echo
  const mute = inputContext.createGain();
  mute.gain.value = 0;
  source.connect(processor);
  processor.connect(mute);
  mute.connect(inputContext.destination);
  processor.onaudioprocess = (event) => {
    if (!canStreamAudio || socket?.readyState !== WebSocket.OPEN) return;
    // Browser gives Float32 (-1..1), convert to PCM16 and send as base64 JSON envelope
    const float32 = event.inputBuffer.getChannelData(0);
    const int16 = floatTo16BitPCM(float32);
    socket.send(
      JSON.stringify({
        data: arrayBufferToBase64(int16.buffer),
        mimeType: "audio/pcm;rate=16000",
      }),
    );
  };
  socket = new WebSocket(WS_URL);
  socket.onopen = () => {
    console.log("Connected. Waiting for setupComplete...");
  };
  socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    console.log("Event:", message);
    if (message.setupComplete || (message.type === "status" && /ready/i.test(message.message || ""))) {
      canStreamAudio = true;
      return;
    }
    const b64 = message?.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (typeof b64 === "string" && b64.length) {
      await playPcm16Base64(b64, OUTPUT_RATE);
    }
    if (message?.error) {
      console.error("Realtime error:", message.error);
    }
  };
  socket.onerror = (event) => {
    console.error("WebSocket error:", event);
  };
  socket.onclose = (event) => {
    console.log(`WebSocket closed code=${event.code} reason=${event.reason || "n/a"}`);
  };
}
function stopRealtime() {
  canStreamAudio = false;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    socket.close(1000, "client-stop");
  }
  if (processor) processor.disconnect();
  if (source) source.disconnect();
  if (stream) stream.getTracks().forEach((t) => t.stop());
  if (inputContext) inputContext.close();
  if (outputContext) outputContext.close();
}
function floatTo16BitPCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}
function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
async function playPcm16Base64(base64Audio, sampleRate = 24000) {
  const bytes = base64ToUint8Array(base64Audio);
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768;
  }
  const buffer = outputContext.createBuffer(1, float32.length, sampleRate);
  buffer.copyToChannel(float32, 0);
  const src = outputContext.createBufferSource();
  src.buffer = buffer;
  src.connect(outputContext.destination);
  const startAt = Math.max(outputContext.currentTime, nextStartTime);
  src.start(startAt);
  nextStartTime = startAt + buffer.duration;
}
Protocol & Events
The WebSocket handles bidirectional traffic.

Connect + Setup Handshake
After connecting, wait for a readiness event before streaming microphone frames.


{
  "setupComplete": true
}
Some integrations may also emit:


{
  "type": "status",
  "message": "Ready to start conversation"
}
Client to Server Audio
Send JSON envelopes with base64 PCM16 chunks.


{
  "data": "BASE64_ENCODED_PCM16_CHUNK",
  "mimeType": "audio/pcm;rate=16000"
}
Server to Client
Server events are JSON messages.

AI Audio Response
The model audio is returned as base64 PCM16 under inlineData.data.


{
  "serverContent": {
    "modelTurn": {
      "parts": [
        {
          "inlineData": {
            "data": "BASE64_ENCODED_PCM16_AUDIO"
          }
        }
      ]
    }
  }
}
Turn Complete & Usage
When the AI finishes speaking, the server sends a completion event with billing details.


{
  "serverContent": {
    "turnComplete": true
  },
  "usageMetadata": {
    "totalBilledAudioDurationSeconds": 5.2
  }
}
Warning Messages
Sent if there are non-critical issues, such as billing thresholds.


{
  "type": "warning",
  "message": "Your wallet balance is low. Please top up to avoid service interruption."
}
Error Messages
Sent if a critical failure occurs.


{
  "error": {
    "message": "AI service error",
    "status": 500,
    "timestamp": "2025-07-15T10:00:00.000Z"
  }
}
Connection Troubleshooting
If the socket closes with 1006, verify:
You used the correct endpoint.
The apiKey query value is valid.
Client audio is sent as JSON (data + mimeType), not raw binary.
Live Interactive Demo
Use the embedded tool below to test the Realtime API directly from this page.

Live Realtime Voice Demo
Integrated browser demo with start/stop, playback, and logs.

API Key
sk_...
Endpoint
wss://relay.addisassistant.com/ws?apiKey=YOUR_API_KEY
Start
Stop
Clear Logs
Idle
Ready to connect.
Events / Logs
[21:12:43] Ready. Enter API key and click Start.
Use on localhost or https. For production, issue short-lived auth from your backend.

Standalone HTML (Local Testing)
Use this standalone file if you want to run the same flow outside the docs site.


<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Realtime Voice Test</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 24px;">
    <h2>Realtime Voice Test</h2>
    <input id="apiKey" type="password" placeholder="sk_..." style="width: 340px; padding: 8px;" />
    <button id="startBtn">Start</button>
    <button id="stopBtn" disabled>Stop</button>
    <pre id="log" style="margin-top: 16px; border: 1px solid #ddd; padding: 12px; min-height: 140px;"></pre>
    <script>
      const WS_URL = "wss://relay.addisassistant.com/ws";
      const INPUT_RATE = 16000;
      const OUTPUT_RATE = 24000;
      let ws;
      let inputCtx;
      let outputCtx;
      let stream;
      let sourceNode;
      let processorNode;
      let muteNode;
      let canStream = false;
      let nextStartTime = 0;
      const logEl = document.getElementById("log");
      const startBtn = document.getElementById("startBtn");
      const stopBtn = document.getElementById("stopBtn");
      const apiKeyEl = document.getElementById("apiKey");
      function log(message) {
        const t = new Date().toLocaleTimeString();
        logEl.textContent += `[${t}] ${message}\n`;
        logEl.scrollTop = logEl.scrollHeight;
      }
      function f32ToPcm16(float32) {
        const out = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return out;
      }
      function abToBase64(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
      function base64ToAb(base64) {
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes.buffer;
      }
      async function playPcm16(arrayBuffer) {
        if (!outputCtx) return;
        const pcm16 = new Int16Array(arrayBuffer);
        const f32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768;
        const buffer = outputCtx.createBuffer(1, f32.length, OUTPUT_RATE);
        buffer.copyToChannel(f32, 0);
        const src = outputCtx.createBufferSource();
        src.buffer = buffer;
        src.connect(outputCtx.destination);
        const startAt = Math.max(outputCtx.currentTime, nextStartTime);
        src.start(startAt);
        nextStartTime = startAt + buffer.duration;
      }
      async function stop() {
        canStream = false;
        if (ws && (ws.readyState === 0 || ws.readyState === 1)) ws.close(1000, "client-stop");
        ws = null;
        try { if (processorNode) processorNode.disconnect(); } catch {}
        try { if (sourceNode) sourceNode.disconnect(); } catch {}
        try { if (muteNode) muteNode.disconnect(); } catch {}
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (inputCtx) await inputCtx.close().catch(() => {});
        if (outputCtx) await outputCtx.close().catch(() => {});
        inputCtx = outputCtx = null;
        stream = sourceNode = processorNode = muteNode = null;
        nextStartTime = 0;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        log("Stopped.");
      }
      async function start() {
        const apiKey = apiKeyEl.value.trim();
        if (!apiKey) return log("Missing API key.");
        startBtn.disabled = true;
        stopBtn.disabled = false;
        outputCtx = new AudioContext({ sampleRate: OUTPUT_RATE });
        await outputCtx.resume();
        nextStartTime = outputCtx.currentTime;
        inputCtx = new AudioContext({ sampleRate: INPUT_RATE });
        await inputCtx.resume();
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        sourceNode = inputCtx.createMediaStreamSource(stream);
        processorNode = inputCtx.createScriptProcessor(2048, 1, 1);
        muteNode = inputCtx.createGain();
        muteNode.gain.value = 0;
        processorNode.onaudioprocess = (event) => {
          if (!canStream || !ws || ws.readyState !== 1) return;
          const f32 = event.inputBuffer.getChannelData(0);
          const pcm16 = f32ToPcm16(f32);
          ws.send(JSON.stringify({ data: abToBase64(pcm16.buffer), mimeType: "audio/pcm;rate=16000" }));
        };
        sourceNode.connect(processorNode);
        processorNode.connect(muteNode);
        muteNode.connect(inputCtx.destination);
        const url = new URL(WS_URL);
        url.searchParams.set("apiKey", apiKey);
        ws = new WebSocket(url.toString());
        ws.onopen = () => log("Connected. Waiting for setupComplete...");
        ws.onmessage = async (event) => {
          const msg = JSON.parse(event.data);
          if (msg.setupComplete || (msg.type === "status" && /ready/i.test(msg.message || ""))) {
            canStream = true;
            return log("Setup complete. Streaming live.");
          }
          const b64 = msg?.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (typeof b64 === "string" && b64.length) await playPcm16(base64ToAb(b64));
          if (msg?.error) log(`Server error: ${JSON.stringify(msg.error)}`);
        };
        ws.onclose = (e) => log(`Closed code=${e.code} reason=${e.reason || "n/a"}`);
        ws.onerror = () => log("WebSocket error");
      }
      startBtn.onclick = () => void start();
      stopBtn.onclick = () => void stop();
      window.addEventListener("beforeunload", () => void stop());
    </script>
  </body>
</html>
Capabilities Roadmap
We are rapidly expanding the Realtime engine.

VAD (Voice Activity Detection)

The model currently uses server-side VAD to determine when the user has stopped speaking.

Knowledge Base

Coming Soon
Soon you will be able to attach PDFs or Text documents to the Realtime session. This will allow the voice assistant to answer questions specifically based on your uploaded data (RAG).

Multimodal

Chat with images and audio files using our unified Multimodal Model.

Translation

High-accuracy neural machine translation for African languag