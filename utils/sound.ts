import { Platform } from 'react-native';
// Static imports are fine — Platform.OS guards prevent them running on web
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

// ─── Web: Web Audio API ────────────────────────────────────────────────────

let webCtx: AudioContext | null = null;

function playWebChime() {
  try {
    if (!webCtx) webCtx = new AudioContext();
    const ctx = webCtx;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.exp(-t * 5) * Math.min(i / 40, 1);
      data[i] = env * (0.6 * Math.sin(2 * Math.PI * 880 * t) + 0.4 * Math.sin(2 * Math.PI * 1320 * t));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  } catch {}
}

// ─── Native: WAV file via expo-av ─────────────────────────────────────────

let soundObj: Audio.Sound | null = null;
let initPromise: Promise<void> | null = null;

// expo-file-system v19 moved cacheDirectory/EncodingType — access via legacy cast
const FS = FileSystem as unknown as {
  cacheDirectory: string;
  getInfoAsync: (uri: string) => Promise<{ exists: boolean }>;
  writeAsStringAsync: (uri: string, content: string, opts: { encoding: string }) => Promise<void>;
  EncodingType: { Base64: string };
};

function buildChimeWAV(): Uint8Array {
  const sampleRate = 8000;
  const numSamples = 3200;
  const buf = new ArrayBuffer(44 + numSamples);
  const dv = new DataView(buf);
  const b = new Uint8Array(buf);
  b.set([0x52,0x49,0x46,0x46], 0); dv.setUint32(4, 36 + numSamples, true);
  b.set([0x57,0x41,0x56,0x45], 8); b.set([0x66,0x6D,0x74,0x20], 12);
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate, true);
  dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  b.set([0x64,0x61,0x74,0x61], 36); dv.setUint32(40, numSamples, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 5) * Math.min(i / 40, 1);
    const v = env * (0.6 * Math.sin(2 * Math.PI * 880 * t) + 0.4 * Math.sin(2 * Math.PI * 1320 * t));
    b[44 + i] = Math.round(128 + 100 * v);
  }
  return b;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

async function initNativeSound() {
  const path = `${FS.cacheDirectory}chime_v1.wav`;
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const info = await FS.getInfoAsync(path);
  if (!info.exists) {
    await FS.writeAsStringAsync(path, toBase64(buildChimeWAV()), {
      encoding: FS.EncodingType.Base64,
    });
  }
  const { sound } = await Audio.Sound.createAsync({ uri: path });
  soundObj = sound;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function initSound() {
  if (Platform.OS === 'web') return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = initNativeSound().catch(() => {});
  return initPromise;
}

export async function playChime() {
  if (Platform.OS === 'web') { playWebChime(); return; }
  try {
    if (!soundObj) return;
    await soundObj.setPositionAsync(0);
    await soundObj.playAsync();
  } catch {}
}
