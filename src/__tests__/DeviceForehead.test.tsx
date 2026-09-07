import React from 'react';
import { render } from '@testing-library/react-native';
import { DeviceForehead } from '../components/frame/DeviceForehead';

describe('DeviceForehead', () => {
  it('renders an off-center camera dot and speaker grille for phones', () => {
    const { getByTestId } = render(<DeviceForehead width={375} height={56} color="#111111" />);
    expect(getByTestId('device-forehead')).toBeTruthy();
    expect(getByTestId('device-forehead-camera')).toBeTruthy();
    expect(getByTestId('device-forehead-speaker')).toBeTruthy();
  });

  it('renders a centered camera dot with no speaker grille for tablets', () => {
    const { getByTestId, queryByTestId } = render(
      <DeviceForehead width={810} height={56} color="#111111" formFactor="tablet" />
    );
    expect(getByTestId('device-forehead-camera')).toBeTruthy();
    expect(queryByTestId('device-forehead-speaker')).toBeNull();
  });
});
