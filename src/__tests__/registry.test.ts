import { devicePresets } from '../devices/presets';
import {
  registerCustomDevice,
  getCustomDevices,
  getAllDevicePresets,
  resetCustomDevices,
  parseDevicePresetJson,
  applyDeviceFromJson,
} from '../devices/registry';

const VALID_PRESET_JSON = JSON.stringify({
  id: 'my-tv',
  name: 'My TV',
  platform: 'custom',
  formFactor: 'tablet',
  width: 1920,
  height: 1080,
  pixelRatio: 1,
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
});

describe('device registry', () => {
  afterEach(() => {
    resetCustomDevices();
  });

  it('starts empty', () => {
    expect(getCustomDevices()).toEqual([]);
    expect(getAllDevicePresets()).toEqual(devicePresets);
  });

  it('registerCustomDevice adds a device to getAllDevicePresets', () => {
    const preset = parseDevicePresetJson(VALID_PRESET_JSON);
    registerCustomDevice(preset);
    expect(getCustomDevices()).toEqual([preset]);
    expect(getAllDevicePresets()).toEqual([...devicePresets, preset]);
  });

  it('registerCustomDevice replaces an existing device with the same id', () => {
    const preset = parseDevicePresetJson(VALID_PRESET_JSON);
    registerCustomDevice(preset);
    const updated = { ...preset, name: 'My TV v2' };
    registerCustomDevice(updated);
    expect(getCustomDevices()).toEqual([updated]);
  });

  it('resetCustomDevices clears the registry', () => {
    registerCustomDevice(parseDevicePresetJson(VALID_PRESET_JSON));
    resetCustomDevices();
    expect(getCustomDevices()).toEqual([]);
  });

  it('parseDevicePresetJson returns a valid DevicePreset for well-formed JSON, defaulting notch/homeIndicator to "none"', () => {
    const preset = parseDevicePresetJson(VALID_PRESET_JSON);
    expect(preset).toEqual({
      id: 'my-tv',
      name: 'My TV',
      platform: 'custom',
      formFactor: 'tablet',
      width: 1920,
      height: 1080,
      pixelRatio: 1,
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      notch: 'none',
      homeIndicator: 'none',
    });
  });

  it('parseDevicePresetJson accepts an explicit valid notch/homeIndicator', () => {
    const withStyles = JSON.stringify({
      ...JSON.parse(VALID_PRESET_JSON),
      notch: 'punch-hole',
      homeIndicator: 'gesture-pill',
    });
    const preset = parseDevicePresetJson(withStyles);
    expect(preset.notch).toBe('punch-hole');
    expect(preset.homeIndicator).toBe('gesture-pill');
  });

  it('parseDevicePresetJson rejects an invalid notch value', () => {
    const bad = JSON.stringify({ ...JSON.parse(VALID_PRESET_JSON), notch: 'sunroof' });
    expect(() => parseDevicePresetJson(bad)).toThrow(/"notch" must be one of/);
  });

  it('parseDevicePresetJson rejects an invalid homeIndicator value', () => {
    const bad = JSON.stringify({ ...JSON.parse(VALID_PRESET_JSON), homeIndicator: 'joystick' });
    expect(() => parseDevicePresetJson(bad)).toThrow(/"homeIndicator" must be one of/);
  });

  it('parseDevicePresetJson throws on malformed JSON', () => {
    expect(() => parseDevicePresetJson('{not json')).toThrow('Invalid JSON.');
  });

  it('parseDevicePresetJson throws listing every missing/invalid field', () => {
    expect(() => parseDevicePresetJson('{}')).toThrow(/"id" must be a non-empty string/);
    expect(() => parseDevicePresetJson('{}')).toThrow(/"platform" must be one of/);
    expect(() => parseDevicePresetJson('{}')).toThrow(/"insets" must be an object/);
  });

  it('parseDevicePresetJson rejects an unknown platform', () => {
    const bad = JSON.stringify({ ...JSON.parse(VALID_PRESET_JSON), platform: 'atari' });
    expect(() => parseDevicePresetJson(bad)).toThrow(/"platform" must be one of/);
  });

  it('applyDeviceFromJson parses, registers, and returns the preset', () => {
    const preset = applyDeviceFromJson(VALID_PRESET_JSON);
    expect(preset.id).toBe('my-tv');
    expect(getCustomDevices()).toEqual([preset]);
  });
});
