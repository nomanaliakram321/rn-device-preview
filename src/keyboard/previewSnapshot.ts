import { defaultDevice } from '../devices/presets';

export interface PreviewSnapshot {
  enabled: boolean;
  virtualKeyboardVisible: boolean;
  /** DeviceFrame's current fit-to-host scale factor (1 = no scaling). */
  scale: number;
  /** Simulated device width, in simulated logical pixels. */
  deviceWidth: number;
  /**
   * Simulated device height, in simulated logical pixels. Needed (alongside
   * a bridged event's `height`) to compute the `screenY` a real
   * `KeyboardAvoidingView` expects: the keyboard's top-edge y-position
   * within the simulated viewport is `deviceHeight - height`.
   */
  deviceHeight: number;
}

// deviceWidth/deviceHeight default to the default device preset's own
// dimensions, not 0 — DevicePreviewProvider (which installs the keyboard
// bridge) is a supported standalone API surface usable without <DeviceFrame>
// ever mounting to populate these. A 0 default would make a real keyboard
// event's screenY compute as `0 - height` (negative), producing a wrong,
// oversized KeyboardAvoidingView offset for that standalone usage.
export const previewSnapshot: PreviewSnapshot = {
  enabled: false,
  virtualKeyboardVisible: false,
  scale: 1,
  deviceWidth: defaultDevice.width,
  deviceHeight: defaultDevice.height,
};

type SnapshotListener = () => void;
const listeners = new Set<SnapshotListener>();

export function updatePreviewSnapshot(partial: Partial<PreviewSnapshot>): void {
  Object.assign(previewSnapshot, partial);
  listeners.forEach((listener) => listener());
}

export function subscribeToPreviewSnapshot(listener: SnapshotListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
