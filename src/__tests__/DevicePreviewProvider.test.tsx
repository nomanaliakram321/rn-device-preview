import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { useDevicePreview } from '../context/DevicePreviewContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <DevicePreviewProvider persist={false}>{children}</DevicePreviewProvider>;
}

describe('DevicePreviewProvider Phase B fields', () => {
  it('defaults the four new fields', () => {
    const { result } = renderHook(() => useDevicePreview(), { wrapper });
    expect(result.current?.accessibleNavigation).toBe(false);
    expect(result.current?.invertColors).toBe(false);
    expect(result.current?.virtualKeyboardVisible).toBe(false);
    expect(typeof result.current?.backgroundColor).toBe('string');
  });

  it('setAccessibleNavigation updates state', () => {
    const { result } = renderHook(() => useDevicePreview(), { wrapper });
    act(() => result.current?.setAccessibleNavigation(true));
    expect(result.current?.accessibleNavigation).toBe(true);
  });

  it('setInvertColors updates state', () => {
    const { result } = renderHook(() => useDevicePreview(), { wrapper });
    act(() => result.current?.setInvertColors(true));
    expect(result.current?.invertColors).toBe(true);
  });

  it('setBackgroundColor updates state', () => {
    const { result } = renderHook(() => useDevicePreview(), { wrapper });
    act(() => result.current?.setBackgroundColor('#000000'));
    expect(result.current?.backgroundColor).toBe('#000000');
  });

  it('setVirtualKeyboardVisible updates state', () => {
    const { result } = renderHook(() => useDevicePreview(), { wrapper });
    act(() => result.current?.setVirtualKeyboardVisible(true));
    expect(result.current?.virtualKeyboardVisible).toBe(true);
  });
});
