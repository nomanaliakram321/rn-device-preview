import { useWindowDimensions } from 'react-native';
import { useDevicePreview } from '../context/DevicePreviewContext';

export interface SimulatedDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * Drop-in replacement for RN's useWindowDimensions().
 * Falls back to real dimensions when used outside a DevicePreviewProvider,
 * or when the preview is disabled — so it's safe to use unconditionally
 * throughout your app.
 */
export function useSimulatedDimensions(): SimulatedDimensions {
  const real = useWindowDimensions();
  const preview = useDevicePreview();

  if (!preview || !preview.enabled) {
    return {
      width: real.width,
      height: real.height,
      scale: real.scale,
      fontScale: real.fontScale,
    };
  }

  const { device, orientation, fontScale } = preview;
  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? device.height : device.width;
  const height = isLandscape ? device.width : device.height;

  return {
    width,
    height,
    scale: device.pixelRatio,
    fontScale,
  };
}
