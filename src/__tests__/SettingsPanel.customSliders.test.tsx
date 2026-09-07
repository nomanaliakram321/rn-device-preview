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
  fireEvent.press(utils.getByText('Custom'));
  return utils;
}

describe('SettingsPanel Custom size sliders', () => {
  it('shows Width/Height/Pixel ratio rows defaulting to 640/1024/2', () => {
    const { getByText } = renderPanel();
    expect(getByText('Width: 640px')).toBeTruthy();
    expect(getByText('Height: 1024px')).toBeTruthy();
    expect(getByText('Pixel ratio: 2.00')).toBeTruthy();
  });

  it('does not show Custom size rows on other platform tabs', () => {
    const { getByText, queryByText } = renderPanel();
    fireEvent.press(getByText('iOS'));
    expect(queryByText('CUSTOM SIZE')).toBeNull();
  });

  it('increments width by 10 when the width + stepper is pressed', () => {
    const { getByTestId, getByText } = renderPanel();
    fireEvent.press(getByTestId('custom-width-increment'));
    expect(getByText('Width: 650px')).toBeTruthy();
  });

  it('never lets width drop below 100', () => {
    const { getByTestId, getByText } = renderPanel();
    for (let i = 0; i < 60; i++) {
      fireEvent.press(getByTestId('custom-width-decrement'));
    }
    expect(getByText('Width: 100px')).toBeTruthy();
  });

  it('increments pixel ratio by 0.25 when the + stepper is pressed', () => {
    const { getByTestId, getByText } = renderPanel();
    fireEvent.press(getByTestId('custom-pixel-ratio-increment'));
    expect(getByText('Pixel ratio: 2.25')).toBeTruthy();
  });
});
