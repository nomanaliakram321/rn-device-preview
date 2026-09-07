import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { SettingsPanel } from '../components/SettingsPanel';
import { resetCustomDevices } from '../devices/registry';

function renderPanel() {
  const utils = render(
    <DevicePreviewProvider persist={false}>
      <SettingsPanel />
    </DevicePreviewProvider>
  );
  fireEvent.press(utils.getByText('Device Preview'));
  fireEvent.press(utils.getByText('Custom'));
  return utils;
}

const VALID_JSON = JSON.stringify({
  id: 'json-device',
  name: 'JSON Device',
  platform: 'custom',
  formFactor: 'tablet',
  width: 999,
  height: 999,
  pixelRatio: 2,
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
});

describe('SettingsPanel New device from JSON', () => {
  afterEach(() => {
    resetCustomDevices();
  });

  it('shows a "New device from JSON…" entry on the Custom tab', () => {
    const { getByTestId } = renderPanel();
    expect(getByTestId('new-device-json-toggle')).toBeTruthy();
  });

  it('opens a JSON input form when the entry is pressed', () => {
    const { getByTestId } = renderPanel();
    fireEvent.press(getByTestId('new-device-json-toggle'));
    expect(getByTestId('new-device-json-input')).toBeTruthy();
  });

  it('registers and selects a valid device, then lists it as a chip', async () => {
    const { getByTestId, getByText } = renderPanel();
    fireEvent.press(getByTestId('new-device-json-toggle'));
    fireEvent.changeText(getByTestId('new-device-json-input'), VALID_JSON);
    fireEvent.press(getByTestId('new-device-json-submit'));
    await waitFor(() => expect(getByText('JSON Device')).toBeTruthy());
  });

  it('shows a validation error and does not register an invalid device', () => {
    const { getByTestId } = renderPanel();
    fireEvent.press(getByTestId('new-device-json-toggle'));
    fireEvent.changeText(getByTestId('new-device-json-input'), '{ "id": "x" }');
    fireEvent.press(getByTestId('new-device-json-submit'));
    expect(getByTestId('new-device-json-error')).toBeTruthy();
  });
});
