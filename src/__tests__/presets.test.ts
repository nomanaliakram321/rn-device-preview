import { devicePresets } from '../devices/presets';

describe('devicePresets', () => {
  it('every preset has a formFactor', () => {
    for (const preset of devicePresets) {
      expect(preset.formFactor).toBeTruthy();
    }
  });

  it('every preset has a notch and homeIndicator style', () => {
    for (const preset of devicePresets) {
      expect(preset.notch).toBeTruthy();
      expect(preset.homeIndicator).toBeTruthy();
    }
  });

  it('includes multiple iPhone size variants across notch and Dynamic Island generations', () => {
    const ids = devicePresets.map((d) => d.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'iphone-12-mini',
        'iphone-13-mini',
        'iphone-14',
        'iphone-14-plus',
        'iphone-14-pro',
        'iphone-14-pro-max',
        'iphone-17',
        'iphone-17-pro',
        'iphone-17-pro-max',
      ])
    );
  });

  it('includes multiple Pixel variants', () => {
    const ids = devicePresets.map((d) => d.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'pixel-6',
        'pixel-6-pro',
        'pixel-7',
        'pixel-7-pro',
        'pixel-8',
        'pixel-8-pro',
        'pixel-9',
        'pixel-9-pro',
      ])
    );
  });

  it('gives notch-era iPhones "notch" and Dynamic-Island-era iPhones "dynamic-island"', () => {
    const find = (id: string) => devicePresets.find((d) => d.id === id)!;
    expect(find('iphone-11').notch).toBe('notch');
    expect(find('iphone-14').notch).toBe('notch');
    expect(find('iphone-14-pro').notch).toBe('dynamic-island');
    expect(find('iphone-15').notch).toBe('dynamic-island');
    expect(find('iphone-17').notch).toBe('dynamic-island');
  });

  it('gives the iPhone SE a physical home button, not a swipe bar', () => {
    const se = devicePresets.find((d) => d.id === 'iphone-se')!;
    expect(se.notch).toBe('none');
    expect(se.homeIndicator).toBe('physical-button');
  });

  it('gives every Android device a punch-hole notch and gesture-pill indicator', () => {
    const android = devicePresets.filter((d) => d.platform === 'android');
    expect(android.length).toBeGreaterThan(0);
    for (const preset of android) {
      expect(preset.notch).toBe('punch-hole');
      expect(preset.homeIndicator).toBe('gesture-pill');
    }
  });
});
