export { DevicePreview } from './components/DevicePreview';
export { DevicePreviewProvider } from './context/DevicePreviewProvider';
export { useDevicePreview } from './context/DevicePreviewContext';

export { useSimulatedDimensions } from './hooks/useSimulatedDimensions';
export { useSimulatedInsets } from './hooks/useSimulatedInsets';
export { useSimulatedLocale } from './hooks/useSimulatedLocale';
export { useSimulatedFontScale } from './hooks/useSimulatedFontScale';
export { useSimulatedKeyboardHeight } from './hooks/useSimulatedKeyboardHeight';

export { SimulatedKeyboard } from './components/SimulatedKeyboard';

export { devicePresets, defaultDevice } from './devices/presets';
export type { DevicePreset, DevicePreviewState, Orientation, SafeAreaInsets } from './devices/types';

export type { ToolDefinition } from './plugins/types';
export { defaultTools } from './plugins/defaultTools';

export { registerCustomDevice, applyDeviceFromJson, getAllDevicePresets } from './devices/registry';
