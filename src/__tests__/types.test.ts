import { DevicePreset, DevicePreviewState, FormFactor, DevicePlatform } from '../devices/types';

describe('types', () => {
  it('DevicePreset accepts formFactor and platform literals', () => {
    const preset: DevicePreset = {
      id: 'test',
      name: 'Test Device',
      platform: 'ios',
      formFactor: 'tablet',
      width: 100,
      height: 100,
      pixelRatio: 2,
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      notch: 'none',
      homeIndicator: 'none',
    };
    expect(preset.formFactor).toBe('tablet');
  });

  it('DevicePreviewState has the Phase B fields', () => {
    const state: DevicePreviewState = {
      enabled: true,
      device: {
        id: 'x',
        name: 'x',
        platform: 'custom',
        formFactor: 'phone',
        width: 1,
        height: 1,
        pixelRatio: 1,
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
        notch: 'none',
        homeIndicator: 'none',
      },
      orientation: 'portrait',
      locale: 'en-US',
      theme: 'light',
      fontScale: 1,
      boldText: false,
      frameVisible: true,
      accessibleNavigation: false,
      invertColors: false,
      backgroundColor: '#f2f2f2',
      virtualKeyboardVisible: false,
    };
    expect(state.accessibleNavigation).toBe(false);
  });

  it('FormFactor and DevicePlatform export the expected literal unions', () => {
    const formFactors: FormFactor[] = ['phone', 'tablet'];
    const platforms: DevicePlatform[] = ['ios', 'android', 'custom'];
    expect(formFactors).toHaveLength(2);
    expect(platforms).toHaveLength(3);
  });
});
