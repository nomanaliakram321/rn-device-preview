import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePreferences, loadPreferences } from '../storage/persistPreferences';
import { defaultState } from '../context/DevicePreviewContext';
import { devicePresets } from '../devices/presets';

describe('persistPreferences', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips a full Phase B state', async () => {
    const state = { ...defaultState, invertColors: true, backgroundColor: '#123456' };
    await savePreferences(state);
    const loaded = await loadPreferences();
    expect(loaded?.invertColors).toBe(true);
    expect(loaded?.backgroundColor).toBe('#123456');
    expect(loaded?.device.id).toBe(state.device.id);
  });

  it('backfills Phase B fields when loading a pre-Phase-B saved blob', async () => {
    const legacyPayload = {
      enabled: true,
      deviceId: devicePresets[0].id,
      orientation: 'portrait',
      locale: 'en-US',
      theme: 'light',
      fontScale: 1,
      boldText: false,
      frameVisible: true,
      // no accessibleNavigation / invertColors / backgroundColor / virtualKeyboardVisible
    };
    await AsyncStorage.setItem('@device_preview_rn:preferences', JSON.stringify(legacyPayload));
    const loaded = await loadPreferences();
    expect(loaded?.accessibleNavigation).toBe(false);
    expect(loaded?.invertColors).toBe(false);
    expect(loaded?.backgroundColor).toBe(defaultState.backgroundColor);
    expect(loaded?.virtualKeyboardVisible).toBe(false);
  });

  it('returns null when nothing is stored', async () => {
    expect(await loadPreferences()).toBeNull();
  });
});
