import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { SettingsPanel } from '../components/SettingsPanel';
import { DeviceFrame } from '../components/DeviceFrame';
import { updatePreviewSnapshot, previewSnapshot } from '../keyboard/previewSnapshot';
import { devicePresets } from '../devices/presets';

function renderFrame() {
  const utils = render(
    <DevicePreviewProvider persist={false}>
      <SettingsPanel />
      <DeviceFrame>
        <Text>content</Text>
      </DeviceFrame>
    </DevicePreviewProvider>
  );
  fireEvent.press(utils.getByText('Device Preview'));
  return utils;
}

function flattenBackgroundColors(style: unknown): unknown[] {
  const styles = Array.isArray(style) ? style : [style];
  return styles.filter(Boolean).map((s: any) => s.backgroundColor);
}

describe('DeviceFrame background color', () => {
  it('defaults the host view to #f2f2f2 when no custom color is set', () => {
    const { getByTestId } = renderFrame();
    const host = getByTestId('device-preview-frame-host');
    expect(flattenBackgroundColors(host.props.style)).toContain('#f2f2f2');
  });

  it('reflects a custom backgroundColor chosen via the settings panel swatches', () => {
    const utils = renderFrame();
    const customSwatch = '#1c1c1e';

    // Press the swatch by finding the Pressable whose style includes the custom color.
    const allPressables = utils.UNSAFE_getAllByType(require('react-native').Pressable);
    const swatchPressable = allPressables.find((node: any) => {
      const style = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
      return style.some((s: any) => s && s.backgroundColor === customSwatch);
    });
    expect(swatchPressable).toBeTruthy();
    fireEvent.press(swatchPressable!);

    const host = utils.getByTestId('device-preview-frame-host');
    expect(flattenBackgroundColors(host.props.style)).toContain(customSwatch);
  });
});

describe('DeviceFrame simulated keyboard', () => {
  afterEach(() => {
    updatePreviewSnapshot({
      enabled: false,
      virtualKeyboardVisible: false,
      scale: 1,
      deviceWidth: 0,
      deviceHeight: 0,
    });
  });

  it('does not render the simulated keyboard by default', () => {
    const { queryByTestId } = renderFrame();
    expect(queryByTestId('simulated-keyboard')).toBeNull();
  });

  it('renders the simulated keyboard once virtualKeyboardVisible is toggled on', () => {
    const { getByTestId } = renderFrame();
    fireEvent(getByTestId('virtual-keyboard-switch'), 'valueChange', true);
    expect(getByTestId('simulated-keyboard')).toBeTruthy();
  });

  it('publishes the current scale and device width to previewSnapshot while enabled', () => {
    renderFrame();
    expect(previewSnapshot.scale).toBeGreaterThan(0);
    expect(previewSnapshot.deviceWidth).toBeGreaterThan(0);
  });
});

describe('DeviceFrame Rules of Hooks (toggling the master enabled switch)', () => {
  afterEach(() => {
    updatePreviewSnapshot({
      enabled: false,
      virtualKeyboardVisible: false,
      scale: 1,
      deviceWidth: 0,
      deviceHeight: 0,
    });
  });

  it('does not throw when the master enabled Switch is toggled off then back on', () => {
    const { getByTestId } = renderFrame();
    const enabledSwitch = getByTestId('device-preview-enabled-switch');

    // Toggling `enabled` flips DeviceFrame between its "early return
    // children directly" branch and its full simulated-viewport branch on
    // the SAME mounted component instance. Before the Finding-1 fix,
    // DeviceFrame's useEffect was declared AFTER that early return, so the
    // number of hooks called differed between the two branches — React
    // would throw "Rendered fewer hooks than expected" the moment `enabled`
    // flipped false -> true (or vice versa) at runtime. If that regression
    // reappears, this `fireEvent` sequence throws and the test fails; a
    // passing test proves the fix holds.
    expect(() => {
      fireEvent(enabledSwitch, 'valueChange', false);
      fireEvent(enabledSwitch, 'valueChange', true);
    }).not.toThrow();
  });
});

describe('DeviceFrame bezel', () => {
  afterEach(() => {
    updatePreviewSnapshot({
      enabled: false,
      virtualKeyboardVisible: false,
      scale: 1,
      deviceWidth: devicePresets[0].width,
      deviceHeight: devicePresets[0].height,
    });
  });

  it('renders a physical home-button chin for the default device (iPhone SE)', () => {
    const { getByTestId } = renderFrame();
    expect(getByTestId('device-frame-home-button-chin')).toBeTruthy();
  });

  it('renders no notch overlay for the default device (iPhone SE has notch "none")', () => {
    const { queryByTestId } = renderFrame();
    expect(queryByTestId('bezel-notch')).toBeNull();
    expect(queryByTestId('bezel-dynamic-island')).toBeNull();
    expect(queryByTestId('bezel-punch-hole')).toBeNull();
  });

  it('hides the bezel overlay and home-button chin when frame visibility is off', () => {
    const { getByTestId, queryByTestId } = renderFrame();
    fireEvent(getByTestId('frame-visible-switch'), 'valueChange', false);
    expect(queryByTestId('device-frame-home-button-chin')).toBeNull();
  });

  it('renders a bezel camera dot for a notch-less tablet (iPad Pro 11")', () => {
    const { getByText, getByTestId } = renderFrame();
    fireEvent.press(getByText('iPad Pro 11"'));
    expect(getByTestId('device-bezel-camera')).toBeTruthy();
  });

  it('does not render a bezel camera dot for a notch-less phone (iPhone SE)', () => {
    const { queryByTestId } = renderFrame();
    expect(queryByTestId('device-bezel-camera')).toBeNull();
  });
});
