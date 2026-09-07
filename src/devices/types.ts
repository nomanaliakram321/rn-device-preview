export type DevicePlatform = 'ios' | 'android' | 'custom';

export type FormFactor = 'phone' | 'tablet';

/**
 * What, if anything, is cut into the top of the simulated screen — mirrors
 * real hardware: 'notch' (iPhone X through 14 non-Pro), 'dynamic-island'
 * (iPhone 14 Pro onward), 'punch-hole' (modern Android), 'none'
 * (home-button iPhones, tablets).
 */
export type NotchStyle = 'none' | 'notch' | 'dynamic-island' | 'punch-hole';

/**
 * Only meaningful when `notch: 'notch'`. Apple kept one notch width across
 * X/XS/11/12 ('wide'), then shipped a ~20% narrower notch starting with the
 * iPhone 13 that carried through 14/14 Plus ('narrow') before switching the
 * Pro line to Dynamic Island at 14 Pro. Defaults to 'wide' when omitted.
 */
export type NotchVariant = 'wide' | 'narrow';

/**
 * Only meaningful when `notch: 'punch-hole'`. Most modern Android punch-hole
 * cameras sit dead-center (Pixel, Galaxy), but some (OnePlus 8 Pro) put it in
 * the top-left corner instead. Defaults to 'center' when omitted.
 */
export type NotchPosition = 'center' | 'left';

/**
 * The system navigation affordance at the bottom of the simulated screen.
 * 'physical-button' renders as a chin BELOW the screen area (a real home
 * button sits in the bezel, not on the display); the other styles render
 * ON the display surface itself, matching real hardware — that's why a
 * safe-area bottom inset exists for those but not extra frame height.
 */
export type HomeIndicatorStyle = 'none' | 'swipe-bar' | 'physical-button' | 'gesture-pill';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DevicePreset {
  id: string;
  name: string;
  platform: DevicePlatform;
  formFactor: FormFactor;
  width: number;
  height: number;
  pixelRatio: number;
  insets: SafeAreaInsets;
  /** Top-of-screen cutout style — see `NotchStyle`. */
  notch: NotchStyle;
  /** Narrower notch generation — see `NotchVariant`. Only applies when `notch === 'notch'`. */
  notchVariant?: NotchVariant;
  /** Punch-hole camera placement — see `NotchPosition`. Only applies when `notch === 'punch-hole'`. */
  notchPosition?: NotchPosition;
  /** Bottom system-navigation style — see `HomeIndicatorStyle`. */
  homeIndicator: HomeIndicatorStyle;
  /** Optional bezel image asset shown around the simulated screen */
  frameAsset?: number; // result of require('./frame.png')
  frameSize?: { width: number; height: number };
  /** Offset of the screen cutout inside the frame asset */
  screenOffset?: { x: number; y: number };
}

export type Orientation = 'portrait' | 'landscape';

export interface DevicePreviewState {
  enabled: boolean;
  device: DevicePreset;
  orientation: Orientation;
  locale: string;
  theme: 'light' | 'dark';
  fontScale: number;
  boldText: boolean;
  frameVisible: boolean;
  accessibleNavigation: boolean;
  invertColors: boolean;
  backgroundColor: string;
  virtualKeyboardVisible: boolean;
}
