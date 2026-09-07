import { DevicePreset, DevicePlatform, FormFactor, NotchStyle, HomeIndicatorStyle } from './types';
import { devicePresets as staticPresets } from './presets';

let customDevices: DevicePreset[] = [];

/** Register (or replace, by `id`) a custom device — the code-level equivalent of Flutter's `registerPreset`. */
export function registerCustomDevice(preset: DevicePreset): void {
  customDevices = [...customDevices.filter((d) => d.id !== preset.id), preset];
}

export function getCustomDevices(): DevicePreset[] {
  return customDevices;
}

/** Static seed presets plus every registered custom device — what device pickers should list. */
export function getAllDevicePresets(): DevicePreset[] {
  return [...staticPresets, ...customDevices];
}

/** Test-only: clears every registered custom device. */
export function resetCustomDevices(): void {
  customDevices = [];
}

const VALID_PLATFORMS: DevicePlatform[] = ['ios', 'android', 'custom'];
const VALID_FORM_FACTORS: FormFactor[] = ['phone', 'tablet'];
const VALID_NOTCH_STYLES: NotchStyle[] = ['none', 'notch', 'dynamic-island', 'punch-hole'];
const VALID_HOME_INDICATOR_STYLES: HomeIndicatorStyle[] = [
  'none',
  'swipe-bar',
  'physical-button',
  'gesture-pill',
];

/**
 * Validates a JSON device definition against `DevicePreset`'s shape,
 * collecting every problem (not just the first) so a form UI can show the
 * user everything that needs fixing at once.
 */
export function parseDevicePresetJson(raw: string): DevicePreset {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Device definition must be a JSON object.');
  }

  const p = parsed as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof p.id !== 'string' || !p.id) errors.push('"id" must be a non-empty string');
  if (typeof p.name !== 'string' || !p.name) errors.push('"name" must be a non-empty string');
  if (!VALID_PLATFORMS.includes(p.platform as DevicePlatform)) {
    errors.push(`"platform" must be one of: ${VALID_PLATFORMS.join(', ')}`);
  }
  if (!VALID_FORM_FACTORS.includes(p.formFactor as FormFactor)) {
    errors.push(`"formFactor" must be one of: ${VALID_FORM_FACTORS.join(', ')}`);
  }
  if (typeof p.width !== 'number' || p.width <= 0) {
    errors.push('"width" must be a positive number');
  }
  if (typeof p.height !== 'number' || p.height <= 0) {
    errors.push('"height" must be a positive number');
  }
  if (typeof p.pixelRatio !== 'number' || p.pixelRatio <= 0) {
    errors.push('"pixelRatio" must be a positive number');
  }
  const insets = p.insets as Record<string, unknown> | undefined;
  if (
    typeof insets !== 'object' ||
    insets === null ||
    typeof insets.top !== 'number' ||
    typeof insets.bottom !== 'number' ||
    typeof insets.left !== 'number' ||
    typeof insets.right !== 'number'
  ) {
    errors.push('"insets" must be an object with numeric top/bottom/left/right');
  }

  // notch/homeIndicator are optional in hand-written JSON — default to
  // 'none' when absent, but still reject an explicit, unrecognized value
  // (same pattern as platform/formFactor) so a typo doesn't silently apply.
  let notch: NotchStyle = 'none';
  if (p.notch !== undefined) {
    if (!VALID_NOTCH_STYLES.includes(p.notch as NotchStyle)) {
      errors.push(`"notch" must be one of: ${VALID_NOTCH_STYLES.join(', ')}`);
    } else {
      notch = p.notch as NotchStyle;
    }
  }
  let homeIndicator: HomeIndicatorStyle = 'none';
  if (p.homeIndicator !== undefined) {
    if (!VALID_HOME_INDICATOR_STYLES.includes(p.homeIndicator as HomeIndicatorStyle)) {
      errors.push(`"homeIndicator" must be one of: ${VALID_HOME_INDICATOR_STYLES.join(', ')}`);
    } else {
      homeIndicator = p.homeIndicator as HomeIndicatorStyle;
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return {
    id: p.id as string,
    name: p.name as string,
    platform: p.platform as DevicePlatform,
    formFactor: p.formFactor as FormFactor,
    width: p.width as number,
    height: p.height as number,
    pixelRatio: p.pixelRatio as number,
    insets: {
      top: insets!.top as number,
      bottom: insets!.bottom as number,
      left: insets!.left as number,
      right: insets!.right as number,
    },
    notch,
    homeIndicator,
  };
}

/** Parses, registers, and returns a custom device — the code-level equivalent of Flutter's `applyJson`. */
export function applyDeviceFromJson(raw: string): DevicePreset {
  const preset = parseDevicePresetJson(raw);
  registerCustomDevice(preset);
  return preset;
}
