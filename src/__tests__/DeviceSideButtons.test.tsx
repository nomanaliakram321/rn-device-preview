import React from 'react';
import { render } from '@testing-library/react-native';
import { DeviceSideButtons } from '../components/frame/DeviceSideButtons';
import { devicePresets } from '../devices/presets';

function preset(id: string) {
  const found = devicePresets.find((d) => d.id === id);
  if (!found) throw new Error(`no such preset: ${id}`);
  return found;
}

describe('DeviceSideButtons', () => {
  it('renders a mute switch + volume buttons on the left and a power button on the right for iOS phones', () => {
    const { getByTestId } = render(
      <DeviceSideButtons device={preset('iphone-se')} width={375} height={667} />
    );
    expect(getByTestId('device-side-button-left-0')).toBeTruthy();
    expect(getByTestId('device-side-button-left-1')).toBeTruthy();
    expect(getByTestId('device-side-button-left-2')).toBeTruthy();
    expect(getByTestId('device-side-button-right-3')).toBeTruthy();
  });

  it('renders a volume rocker + power button on the right for Android phones', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceSideButtons device={preset('pixel-7')} width={393} height={915} />
    );
    expect(getByTestId('device-side-button-right-0')).toBeTruthy();
    expect(getByTestId('device-side-button-right-1')).toBeTruthy();
    expect(queryByTestId('device-side-button-left-0')).toBeNull();
  });

  it('renders a volume rocker on the right and a power button on the top edge for tablets', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceSideButtons device={preset('ipad-pro-11')} width={834} height={1194} />
    );
    expect(getByTestId('device-side-button-right-0')).toBeTruthy();
    expect(getByTestId('device-side-button-right-1')).toBeTruthy();
    expect(getByTestId('device-side-button-top-2')).toBeTruthy();
    expect(queryByTestId('device-side-button-left-0')).toBeNull();
  });
});
