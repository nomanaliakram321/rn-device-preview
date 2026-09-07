import {
  previewSnapshot,
  updatePreviewSnapshot,
  subscribeToPreviewSnapshot,
} from '../keyboard/previewSnapshot';
import { defaultDevice } from '../devices/presets';

describe('previewSnapshot', () => {
  afterEach(() => {
    updatePreviewSnapshot({
      enabled: false,
      virtualKeyboardVisible: false,
      scale: 1,
      deviceWidth: defaultDevice.width,
      deviceHeight: defaultDevice.height,
    });
  });

  it('starts with sane defaults', () => {
    // deviceWidth/deviceHeight default to the default device preset's own
    // dimensions (not 0), so standalone usage without <DeviceFrame> ever
    // mounting still computes a sane, non-negative screenY for real keyboard
    // events.
    expect(previewSnapshot).toEqual({
      enabled: false,
      virtualKeyboardVisible: false,
      scale: 1,
      deviceWidth: defaultDevice.width,
      deviceHeight: defaultDevice.height,
    });
  });

  it('updatePreviewSnapshot merges a partial update, leaving other fields untouched', () => {
    updatePreviewSnapshot({ enabled: true });
    expect(previewSnapshot.enabled).toBe(true);
    expect(previewSnapshot.scale).toBe(1);
    updatePreviewSnapshot({ scale: 0.5 });
    expect(previewSnapshot.enabled).toBe(true);
    expect(previewSnapshot.scale).toBe(0.5);
  });

  it('subscribeToPreviewSnapshot notifies listeners on every update', () => {
    const listener = jest.fn();
    subscribeToPreviewSnapshot(listener);
    updatePreviewSnapshot({ virtualKeyboardVisible: true });
    expect(listener).toHaveBeenCalledTimes(1);
    updatePreviewSnapshot({ virtualKeyboardVisible: false });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('the unsubscribe function stops further notifications', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToPreviewSnapshot(listener);
    updatePreviewSnapshot({ enabled: true });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    updatePreviewSnapshot({ enabled: false });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
