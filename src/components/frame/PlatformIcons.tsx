import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { DevicePlatform, FormFactor } from '../../devices/types';
import { SettingsGearIcon } from './SettingsGearIcon';

export interface PlatformIconProps {
  size?: number;
  color?: string;
}

const APPLE_PATH =
  'M410 334s-10 29-30 59c-5 9-29 43-58 43-21 0-35-15-62-15-33 0-46 15-67 15-11 1-22-5-34-16-77-73-81-181-52-225 18-29 48-47 81-48 26 0 54 17 65 17 8 0 50-20 74-18 33 3 56 15 73 38-49 24-66 117 10 150zM329 56c8 32-27 93-79 90-3-43 34-87 79-90z';

const ANDROID_PATH =
  'm338.1555 305.70985a14.86683 14.86683 0 1 1 14.8641-14.86963 14.88644 14.88644 0 0 1 -14.8641 14.86963m-164.311 0a14.86683 14.86683 0 1 1 14.864-14.86963 14.883638 14.883638 0 0 1 -14.864 14.86963m169.642-89.54555 29.7085-51.45542a6.1820238 6.1820238 0 1 0 -10.704-6.18821l-30.0839 52.10534c-23.0047-10.49951-48.8417-16.34595-76.4099-16.34595s-53.4024 5.85485-76.4072 16.34595l-30.081-52.10534a6.1811349 6.1811349 0 1 0 -10.7068 6.1798l29.7113 51.46383c-51.0156 27.7475-85.9094 79.39341-91.0135 140.41269h357c-5.1097-61.01928-40.0007-112.66519-91.0135-140.41269';

const PHONE_PATH =
  'M2.375 4h8.281c1.313 0 2.375 1.063 2.375 2.375v19.25c0 1.313-1.063 2.375-2.375 2.375h-8.281c-1.313 0-2.375-1.063-2.375-2.375v-19.25c0-1.313 1.063-2.375 2.375-2.375zM1.531 23.281h9.969v-14.781h-9.969v14.781zM6.5 26.563c0.75 0 1.313-0.563 1.313-1.281 0-0.75-0.563-1.313-1.313-1.313-0.719 0-1.281 0.563-1.281 1.313 0 0.719 0.563 1.281 1.281 1.281z';

const TABLET_PATH =
  'M18.5 0h-14C3.12 0 2 1.12 2 2.5v19C2 22.88 3.12 24 4.5 24h14c1.38 0 2.5-1.12 2.5-2.5v-19C21 1.12 19.88 0 18.5 0zm-7 23c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7.5-4H4V3h15v16z';

/** Apple glyph for the iOS platform tab, drawn from the SVG in .superpowers/sdd/apple-svgrepo-com.svg (path only, no background). */
export function AppleIcon({ size = 18, color = '#ffffff' }: PlatformIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" testID="apple-icon">
      <Path d={APPLE_PATH} fill={color} />
    </Svg>
  );
}

/** Android head glyph for the Android platform tab, drawn from .superpowers/sdd/android-svgrepo-com.svg (path only, no background). */
export function AndroidIcon({ size = 18, color = '#ffffff' }: PlatformIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" testID="android-icon">
      <Path d={ANDROID_PATH} fill={color} />
    </Svg>
  );
}

/** Phone outline glyph for the PHONE form-factor group, drawn from .superpowers/sdd/iphone-svgrepo-com.svg. */
export function PhoneIcon({ size = 18, color = '#ffffff' }: PlatformIconProps) {
  return (
    <Svg width={size} height={size} viewBox="-9.5 0 32 32" testID="phone-icon">
      <Path d={PHONE_PATH} fill={color} />
    </Svg>
  );
}

/** Tablet outline glyph for the TABLET form-factor group, drawn from .superpowers/sdd/ipad-svgrepo-com.svg. */
export function TabletIcon({ size = 18, color = '#ffffff' }: PlatformIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" testID="tablet-icon">
      <Path d={TABLET_PATH} fill={color} />
    </Svg>
  );
}

/** Picks the platform-tab icon (iOS/Android/Custom) matching the SVGs dropped in .superpowers/sdd. */
export function PlatformTabIcon({
  platform,
  size = 18,
  color = '#ffffff',
}: PlatformIconProps & { platform: DevicePlatform }) {
  if (platform === 'ios') return <AppleIcon size={size} color={color} />;
  if (platform === 'android') return <AndroidIcon size={size} color={color} />;
  return <SettingsGearIcon size={size} color={color} />;
}

/** Picks the form-factor group icon (PHONE/TABLET) matching the SVGs dropped in .superpowers/sdd. */
export function FormFactorIcon({
  formFactor,
  size = 14,
  color = '#999999',
}: PlatformIconProps & { formFactor: FormFactor }) {
  return formFactor === 'tablet' ? (
    <TabletIcon size={size} color={color} />
  ) : (
    <PhoneIcon size={size} color={color} />
  );
}
