import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { useDevicePreview } from '../context/DevicePreviewContext';
import { useSimulatedKeyboardHeight } from '../hooks/useSimulatedKeyboardHeight';
import { SIMULATED_KEYBOARD_HEIGHT } from '../keyboard/constants';

function wrapper({ children }: { children: React.ReactNode }) {
  return <DevicePreviewProvider persist={false}>{children}</DevicePreviewProvider>;
}

describe('useSimulatedKeyboardHeight', () => {
  it('returns 0 outside a provider', () => {
    const { result } = renderHook(() => useSimulatedKeyboardHeight());
    expect(result.current).toBe(0);
  });

  it('returns 0 when virtualKeyboardVisible is off', () => {
    const { result } = renderHook(() => useSimulatedKeyboardHeight(), { wrapper });
    expect(result.current).toBe(0);
  });

  it('returns SIMULATED_KEYBOARD_HEIGHT once virtualKeyboardVisible is toggled on', () => {
    const combined = renderHook(
      () => ({
        preview: useDevicePreview(),
        height: useSimulatedKeyboardHeight(),
      }),
      { wrapper }
    );
    act(() => combined.result.current.preview?.setVirtualKeyboardVisible(true));
    combined.rerender({});
    expect(combined.result.current.height).toBe(SIMULATED_KEYBOARD_HEIGHT);
  });
});
