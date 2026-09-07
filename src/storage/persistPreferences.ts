import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevicePreviewState } from '../devices/types';
import { devicePresets, defaultDevice } from '../devices/presets';
import { defaultState } from '../context/DevicePreviewContext';

const STORAGE_KEY = '@device_preview_rn:preferences';

type PersistedPrefs = Omit<DevicePreviewState, 'device'> & { deviceId: string };

// Guards each persisted field's runtime type against `defaultState`'s, so a
// corrupted/stale/older-schema AsyncStorage value (e.g. `fontScale` saved as
// a string, or missing after a partial write) can never override a default
// with a value of the wrong shape — callers like SettingsPanel's
// `fontScale.toFixed(2)` assume the type DevicePreviewState declares.
function sanitizePersistedPrefs(parsed: Partial<PersistedPrefs>): Partial<PersistedPrefs> {
  const clean: Partial<PersistedPrefs> = {};
  (Object.keys(defaultState) as (keyof DevicePreviewState)[]).forEach((key) => {
    if (key === 'device') return;
    const value = (parsed as Record<string, unknown>)[key];
    if (typeof value === typeof defaultState[key]) {
      (clean as Record<string, unknown>)[key] = value;
    }
  });
  if (typeof parsed.deviceId === 'string') {
    clean.deviceId = parsed.deviceId;
  }
  return clean;
}

export async function savePreferences(state: DevicePreviewState): Promise<void> {
  try {
    // Drop `device` before spreading — `PersistedPrefs`'s `Omit<..., 'device'>`
    // only erases it at compile time, so spreading `...state` directly would
    // still write the full (possibly large, nested) DevicePreset object to
    // storage on every change, redundant alongside `deviceId`.
    const { device, ...rest } = state;
    const payload: PersistedPrefs = {
      ...rest,
      deviceId: device.id,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Persistence is a nice-to-have; failures should never break the preview.
  }
}

export async function loadPreferences(): Promise<DevicePreviewState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: Partial<PersistedPrefs> = JSON.parse(raw);
    const safe = sanitizePersistedPrefs(parsed);
    const device = devicePresets.find((d) => d.id === safe.deviceId) ?? defaultDevice;
    const { deviceId: _deviceId, ...rest } = safe;
    return { ...defaultState, ...rest, device };
  } catch {
    return null;
  }
}
