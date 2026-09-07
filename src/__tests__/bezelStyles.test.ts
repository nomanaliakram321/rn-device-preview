import { getBezelStyle } from '../components/frame/bezelStyles';
import { devicePresets } from '../devices/presets';

function preset(id: string) {
  const found = devicePresets.find((d) => d.id === id);
  if (!found) throw new Error(`no such preset: ${id}`);
  return found;
}

describe('getBezelStyle', () => {
  it('gives iOS phones a more rounded, differently-colored bezel than Android phones', () => {
    const ios = getBezelStyle(preset('iphone-se'));
    const android = getBezelStyle(preset('pixel-7'));
    expect(ios.borderRadius).toBeGreaterThan(android.borderRadius);
    expect(ios.borderColor).not.toBe(android.borderColor);
  });

  it('gives tablets a thinner bezel than phones', () => {
    const phone = getBezelStyle(preset('iphone-se'));
    const tablet = getBezelStyle(preset('ipad-pro-11'));
    expect(tablet.borderWidth).toBeLessThan(phone.borderWidth);
  });
});
