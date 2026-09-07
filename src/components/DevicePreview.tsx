import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { DevicePreviewProvider } from '../context/DevicePreviewProvider';
import { DeviceFrame } from './DeviceFrame';
import { SettingsPanel } from './SettingsPanel';
import { ToolDefinition } from '../plugins/types';
import { defaultTools } from '../plugins/defaultTools';

export interface DevicePreviewProps {
  children: ReactNode;
  /** Typically pass `__DEV__` so this never ships in production builds */
  enabled?: boolean;
  persist?: boolean;
  /** Settings-panel tool pages. Defaults to `defaultTools` (Screenshot + File Explorer) — spread it to extend: `tools={[...defaultTools, myTool]}`. */
  tools?: ToolDefinition[];
}

/**
 * Root wrapper — usage mirrors Flutter's DevicePreview widget:
 *
 *   export default function App() {
 *     return (
 *       <DevicePreview enabled={__DEV__}>
 *         <MyApp />
 *       </DevicePreview>
 *     );
 *   }
 *
 * Inside MyApp, use useSimulatedDimensions()/useSimulatedInsets()/
 * useSimulatedLocale()/useSimulatedFontScale() wherever you'd normally
 * call the real RN/safe-area/i18n equivalents.
 */
export function DevicePreview({
  children,
  enabled = true,
  persist = true,
  tools = defaultTools,
}: DevicePreviewProps) {
  return (
    <DevicePreviewProvider enabled={enabled} persist={persist}>
      <View style={styles.root}>
        <DeviceFrame>{children}</DeviceFrame>
        <SettingsPanel tools={tools} />
      </View>
    </DevicePreviewProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
