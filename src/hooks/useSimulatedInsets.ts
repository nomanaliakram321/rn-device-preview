import { useDevicePreview } from '../context/DevicePreviewContext';
import { SafeAreaInsets } from '../devices/types';

const NO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * Drop-in complement to react-native-safe-area-context's useSafeAreaInsets().
 * When the preview is active, returns the simulated device's insets
 * (accounting for orientation) instead of the host device's real insets.
 * Wrap your real SafeAreaProvider value with this in your app root, or
 * call this directly wherever you'd normally call useSafeAreaInsets().
 */
export function useSimulatedInsets(realInsets?: SafeAreaInsets): SafeAreaInsets {
  const preview = useDevicePreview();

  if (!preview || !preview.enabled) {
    return realInsets ?? NO_INSETS;
  }

  const { device, orientation } = preview;
  if (orientation === 'landscape') {
    // Rotate insets: what was top/bottom becomes left/right and vice versa,
    // approximating how notches/home-indicators reposition on rotation.
    return {
      top: device.insets.left,
      bottom: device.insets.right,
      left: device.insets.bottom,
      right: device.insets.top,
    };
  }

  return device.insets;
}
