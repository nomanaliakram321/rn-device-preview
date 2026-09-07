import { DevicePreset } from '../../devices/types';

export interface BezelStyle {
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

/**
 * The outer frame's color/thickness/corner-radius, varied by platform and
 * form factor so an iOS phone doesn't look identical to an Android phone.
 * The actual notch/Dynamic-Island/punch-hole/home-indicator shapes are
 * drawn separately by `DeviceBezelOverlay`.
 */
export function getBezelStyle(device: DevicePreset): BezelStyle {
  const { platform, formFactor } = device;

  if (formFactor === 'tablet') {
    return platform === 'android'
      ? { borderColor: '#2b2b2b', borderWidth: 10, borderRadius: 18 }
      : { borderColor: '#1a1a1a', borderWidth: 10, borderRadius: 24 };
  }
  // phone
  return platform === 'android'
    ? { borderColor: '#2b2b2b', borderWidth: 12, borderRadius: 28 }
    : { borderColor: '#111111', borderWidth: 12, borderRadius: 44 };
}
