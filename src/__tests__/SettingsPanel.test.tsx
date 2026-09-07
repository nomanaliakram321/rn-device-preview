import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { SettingsPanel } from '../components/SettingsPanel';

function renderPanel() {
  const utils = render(
    <DevicePreviewProvider persist={false}>
      <SettingsPanel />
    </DevicePreviewProvider>
  );
  fireEvent.press(utils.getByText('Device Preview'));
  return utils;
}

describe('SettingsPanel Phase B rows', () => {
  it('renders Accessible navigation, Invert colors, and Virtual keyboard preview rows', () => {
    const { getByText } = renderPanel();
    expect(getByText('Accessible navigation')).toBeTruthy();
    expect(getByText('Invert colors')).toBeTruthy();
    expect(getByText('Virtual keyboard preview')).toBeTruthy();
  });

  it('renders platform tabs for iOS, Android, and Custom', () => {
    const { getByText } = renderPanel();
    expect(getByText('iOS')).toBeTruthy();
    expect(getByText('Android')).toBeTruthy();
    expect(getByText('Custom')).toBeTruthy();
  });

  it('shows form-factor section headers when the Android tab is selected', () => {
    const { getByText } = renderPanel();
    fireEvent.press(getByText('Android'));
    expect(getByText('PHONE')).toBeTruthy();
    expect(getByText('TABLET')).toBeTruthy();
  });
});
