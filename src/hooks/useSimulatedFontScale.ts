import { useDevicePreview } from '../context/DevicePreviewContext';

export interface SimulatedFontSettings {
  fontScale: number;
  boldText: boolean;
}

/**
 * Returns the simulated text-scale + bold-text settings. Apply fontScale
 * as a multiplier on your base font sizes, and boldText by switching your
 * text components' fontWeight when true — same pattern Flutter's
 * device_preview uses for its "Bold text" / "Text scaling factor" controls.
 */
export function useSimulatedFontScale(): SimulatedFontSettings {
  const preview = useDevicePreview();
  if (!preview || !preview.enabled) {
    return { fontScale: 1, boldText: false };
  }
  return { fontScale: preview.fontScale, boldText: preview.boldText };
}
