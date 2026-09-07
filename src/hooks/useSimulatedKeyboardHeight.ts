import { useDevicePreview } from '../context/DevicePreviewContext';
import { SIMULATED_KEYBOARD_HEIGHT } from '../keyboard/constants';

/**
 * Returns the simulated keyboard's current height in simulated-device
 * logical pixels — 0 when hidden/disabled, SIMULATED_KEYBOARD_HEIGHT when
 * shown. For automatic layout, prefer using RN's own KeyboardAvoidingView
 * unmodified — the keyboard bridge (installed by DevicePreviewProvider)
 * already redirects it to respond to this value. Use this hook only when
 * you need the raw number for a custom layout calculation.
 */
export function useSimulatedKeyboardHeight(): number {
  const preview = useDevicePreview();
  if (!preview || !preview.enabled) return 0;
  return preview.virtualKeyboardVisible ? SIMULATED_KEYBOARD_HEIGHT : 0;
}
