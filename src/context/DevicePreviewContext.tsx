import { createContext, useContext } from 'react';
import { DevicePreviewState, DevicePreset, Orientation } from '../devices/types';
import { defaultDevice } from '../devices/presets';

export interface DevicePreviewContextValue extends DevicePreviewState {
  setDevice: (device: DevicePreset) => void;
  setOrientation: (orientation: Orientation) => void;
  setLocale: (locale: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setFontScale: (scale: number) => void;
  setBoldText: (bold: boolean) => void;
  setFrameVisible: (visible: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setAccessibleNavigation: (value: boolean) => void;
  setInvertColors: (value: boolean) => void;
  setBackgroundColor: (value: string) => void;
  setVirtualKeyboardVisible: (value: boolean) => void;
  toggleSettingsPanel: () => void;
  isSettingsPanelOpen: boolean;
}

export const defaultState: DevicePreviewState = {
  enabled: true,
  device: defaultDevice,
  orientation: 'portrait',
  locale: 'en-US',
  theme: 'light',
  fontScale: 1,
  boldText: false,
  frameVisible: true,
  accessibleNavigation: false,
  invertColors: false,
  backgroundColor: '#f2f2f2',
  virtualKeyboardVisible: false,
};

// noop fallback so useSimulatedX hooks never crash outside a provider —
// they just return real/default values instead.
export const DevicePreviewContext = createContext<DevicePreviewContextValue | null>(null);

export function useDevicePreview(): DevicePreviewContextValue | null {
  return useContext(DevicePreviewContext);
}
