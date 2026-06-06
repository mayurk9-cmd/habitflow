import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const CHIME_PATH = `${FileSystem.cacheDirectory}chime_v1.wav`;
let soundObj: Audio.Sound | null = null;
let initPromise: Promise<void> | null = null;

function buildChimeWAV(): Uint8Array {
  const sampleRate = 8000;
  const numSamples = 3200; // 0.4 s
  const buf = new ArrayBuffer(44 + numSamples);
  const dv = new DataView(buf);
  const b = new Uint8Array(buf);
  // RIFF
  b.set([0x52,0x49,0x46,0x46], 0);
  dv.setUint32(4, 36 + numSamples, true);
  b.set([0x57,0x41,0x56,0x45], 8);
  b.set([0x66,0x6D,0x74,0x20], 12);
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate, true);
  dv.setUint16(32, 1, true);
  dv.setUint16(34, 8, true);
  b.set([0x64,0x61,0x74,0x61], 36);
  dv.setUint32(40, numSamples, true);
  // 880 Hz + 1320 Hz bell chord with exponential decay
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

export function initSound() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const info = await FileSystem.getInfoAsync(CHIME_PATH);
      if (!info.exists) {
        await FileSystem.writeAsStringAsync(CHIME_PATH, toBase64(buildChimeWAV()), {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      const { sound } = await Audio.Sound.createAsync({ uri: CHIME_PATH });
      soundObj = sound;
    } catch {
      // haptics-only fallback is fine
    }
  })();
  return initPromise;
}

export async function playChime() {
  try {
    if (!soundObj) return;
    await soundObj.setPositionAsync(0);
    await soundObj.playAsync();
  } catch {}
}
