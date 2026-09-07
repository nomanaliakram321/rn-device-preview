import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { SettingsPanel } from '../components/SettingsPanel';
import { ToolDefinition } from '../plugins/types';

const fakeTool: ToolDefinition = {
  id: 'fake-tool',
  label: 'Fake Tool',
  icon: '🔧',
  render: () => <Text>Fake tool content</Text>,
};

function renderPanel(tools: ToolDefinition[] = [fakeTool]) {
  const utils = render(
    <DevicePreviewProvider persist={false}>
      <SettingsPanel tools={tools} />
    </DevicePreviewProvider>
  );
  fireEvent.press(utils.getByText('Device Preview'));
  return utils;
}

describe('SettingsPanel tool navigation', () => {
  it('renders a TOOLS section with a row per tool when tools are provided', () => {
    const { getByText } = renderPanel();
    expect(getByText('TOOLS')).toBeTruthy();
    expect(getByText('Fake Tool')).toBeTruthy();
  });

  it('does not render a TOOLS section when no tools are provided', () => {
    const { queryByText } = renderPanel([]);
    expect(queryByText('TOOLS')).toBeNull();
  });

  it('pushes the tool sub-page when a tool row is pressed, showing its rendered content and a back button', () => {
    const { getByText, getByTestId, queryByText } = renderPanel();
    fireEvent.press(getByText('Fake Tool'));
    expect(getByText('Fake tool content')).toBeTruthy();
    expect(getByTestId('tool-back-button')).toBeTruthy();
    expect(queryByText('DEVICE')).toBeNull();
  });

  it('pops back to the root panel when the back button is pressed', () => {
    const { getByText, getByTestId } = renderPanel();
    fireEvent.press(getByText('Fake Tool'));
    fireEvent.press(getByTestId('tool-back-button'));
    expect(getByText('DEVICE')).toBeTruthy();
    expect(getByText('Fake Tool')).toBeTruthy();
  });

  it('resets to the root panel when the settings panel is closed and reopened', () => {
    const { getByText, getByTestId, queryByText } = renderPanel();
    fireEvent.press(getByText('Fake Tool'));
    expect(getByText('Fake tool content')).toBeTruthy();
    // The sheet stays mounted mid-close-animation, so its header can
    // briefly repeat the toggle bar's own "Device Preview" text — target
    // the toggle bar by testID rather than by that now-ambiguous text.
    fireEvent.press(getByTestId('device-preview-toggle-button'));
    fireEvent.press(getByTestId('device-preview-toggle-button'));
    expect(queryByText('Fake tool content')).toBeNull();
    expect(getByText('DEVICE')).toBeTruthy();
  });
});
