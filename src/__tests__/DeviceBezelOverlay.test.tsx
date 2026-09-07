import React from 'react';
import { render } from '@testing-library/react-native';
import { DeviceBezelOverlay } from '../components/frame/DeviceBezelOverlay';
import { devicePresets } from '../devices/presets';

function preset(id: string) {
  const found = devicePresets.find((d) => d.id === id);
  if (!found) throw new Error(`no such preset: ${id}`);
  return found;
}

describe('DeviceBezelOverlay', () => {
  it('renders a notch shape for notch-style devices, and nothing else on top', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceBezelOverlay device={preset('iphone-11')} width={414} height={896} />
    );
    expect(getByTestId('bezel-notch')).toBeTruthy();
    expect(queryByTestId('bezel-dynamic-island')).toBeNull();
    expect(queryByTestId('bezel-punch-hole')).toBeNull();
  });

  it('renders a Dynamic Island shape for dynamic-island-style devices', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceBezelOverlay device={preset('iphone-15-pro')} width={393} height={852} />
    );
    expect(getByTestId('bezel-dynamic-island')).toBeTruthy();
    expect(queryByTestId('bezel-notch')).toBeNull();
  });

  it('renders a punch-hole shape for Android devices', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceBezelOverlay device={preset('pixel-7')} width={412} height={915} />
    );
    expect(getByTestId('bezel-punch-hole')).toBeTruthy();
    expect(queryByTestId('bezel-notch')).toBeNull();
    expect(queryByTestId('bezel-dynamic-island')).toBeNull();
  });

  it('renders no top cutout for devices with notch "none"', () => {
    const { queryByTestId } = render(
      <DeviceBezelOverlay device={preset('ipad-pro-11')} width={834} height={1194} />
    );
    expect(queryByTestId('bezel-notch')).toBeNull();
    expect(queryByTestId('bezel-dynamic-island')).toBeNull();
    expect(queryByTestId('bezel-punch-hole')).toBeNull();
  });

  it('renders a swipe-bar home indicator for modern iPhones', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceBezelOverlay device={preset('iphone-15-pro')} width={393} height={852} />
    );
    expect(getByTestId('bezel-swipe-bar')).toBeTruthy();
    expect(queryByTestId('bezel-gesture-pill')).toBeNull();
  });

  it('renders a gesture-pill home indicator for Android devices', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceBezelOverlay device={preset('pixel-7')} width={412} height={915} />
    );
    expect(getByTestId('bezel-gesture-pill')).toBeTruthy();
    expect(queryByTestId('bezel-swipe-bar')).toBeNull();
  });

  it('renders no bottom indicator for a physical-button device', () => {
    const { queryByTestId } = render(
      <DeviceBezelOverlay device={preset('iphone-se')} width={375} height={667} />
    );
    expect(queryByTestId('bezel-swipe-bar')).toBeNull();
    expect(queryByTestId('bezel-gesture-pill')).toBeNull();
  });

  it('gives 13/14-generation iPhones a narrower notch than 11/12-generation iPhones', () => {
    // iPhone 12 and iPhone 13 share the same 390pt-wide screen, so any
    // difference in the rendered notch's width isolates the generation
    // (notchVariant), not the container width.
    const extractNotchWidth = (d: string) => {
      // The path is "M x top L x ... L x+notchWidth top Z" — the first
      // number is the left edge (x), the second-to-last is the right edge
      // (x+notchWidth, immediately followed by the closing "top" y value).
      const xs = Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g)).map(Number);
      return xs[xs.length - 2] - xs[0];
    };
    const wide = render(<DeviceBezelOverlay device={preset('iphone-12')} width={390} height={844} />);
    const narrow = render(<DeviceBezelOverlay device={preset('iphone-13')} width={390} height={844} />);
    const wideWidth = extractNotchWidth(wide.getByTestId('bezel-notch').props.d);
    const narrowWidth = extractNotchWidth(narrow.getByTestId('bezel-notch').props.d);
    expect(narrowWidth).toBeLessThan(wideWidth);
  });

  it('renders nothing when width or height is not yet known', () => {
    const { toJSON } = render(<DeviceBezelOverlay device={preset('iphone-se')} width={0} height={0} />);
    expect(toJSON()).toBeNull();
  });
});
