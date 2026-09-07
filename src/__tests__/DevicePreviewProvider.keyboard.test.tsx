import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { useDevicePreview } from '../context/DevicePreviewContext';
import { keyboardBridge } from '../keyboard/keyboardBridge';
import { previewSnapshot } from '../keyboard/previewSnapshot';

function Consumer() {
  const preview = useDevicePreview();
  return <Text testID="enabled-flag">{String(preview?.enabled)}</Text>;
}

describe('DevicePreviewProvider keyboard bridge wiring', () => {
  let installSpy: jest.SpyInstance;
  let uninstallSpy: jest.SpyInstance;

  beforeEach(() => {
    installSpy = jest.spyOn(keyboardBridge, 'install');
    uninstallSpy = jest.spyOn(keyboardBridge, 'uninstall');
  });

  afterEach(() => {
    installSpy.mockRestore();
    uninstallSpy.mockRestore();
    keyboardBridge.uninstall();
  });

  it('installs the bridge when mounted with enabled=true', () => {
    render(
      <DevicePreviewProvider persist={false} enabled>
        <Consumer />
      </DevicePreviewProvider>
    );
    expect(installSpy).toHaveBeenCalled();
  });

  it('does not install the bridge when mounted with enabled=false', () => {
    render(
      <DevicePreviewProvider persist={false} enabled={false}>
        <Consumer />
      </DevicePreviewProvider>
    );
    expect(installSpy).not.toHaveBeenCalled();
  });

  it('uninstalls the bridge when the provider unmounts', () => {
    const { unmount } = render(
      <DevicePreviewProvider persist={false} enabled>
        <Consumer />
      </DevicePreviewProvider>
    );
    unmount();
    expect(uninstallSpy).toHaveBeenCalled();
  });

  it('keeps previewSnapshot.enabled and .virtualKeyboardVisible in sync with state', () => {
    let ctx: ReturnType<typeof useDevicePreview> = null;
    function Capture() {
      ctx = useDevicePreview();
      return null;
    }
    render(
      <DevicePreviewProvider persist={false} enabled>
        <Capture />
      </DevicePreviewProvider>
    );
    expect(previewSnapshot.enabled).toBe(true);
    act(() => ctx?.setVirtualKeyboardVisible(true));
    expect(previewSnapshot.virtualKeyboardVisible).toBe(true);
  });
});
