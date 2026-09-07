import { DevicePreset, FormFactor } from './types';

export function groupByFormFactor(
  presets: DevicePreset[]
): Partial<Record<FormFactor, DevicePreset[]>> {
  const grouped: Partial<Record<FormFactor, DevicePreset[]>> = {};
  for (const preset of presets) {
    const bucket = grouped[preset.formFactor];
    if (bucket) {
      bucket.push(preset);
    } else {
      grouped[preset.formFactor] = [preset];
    }
  }
  return grouped;
}
