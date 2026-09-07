import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface DeviceBezelCameraProps {
  borderWidth: number;
}

/**
 * The front camera dot on tablets that have no on-screen notch/island/
 * punch-hole (modern iPads) — unlike a phone's classic forehead, an iPad's
 * bezel is uniform on every edge, so the camera is just a small dot
 * centered in the top border itself, not a distinct wider strip.
 */
export function DeviceBezelCamera({ borderWidth }: DeviceBezelCameraProps) {
  const size = Math.min(6, Math.max(3, borderWidth * 0.45));
  return (
    <View
      testID="device-bezel-camera"
      pointerEvents="none"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top: borderWidth / 2 - size / 2,
          marginLeft: -size / 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: '50%',
    backgroundColor: '#3a3a3a',
    zIndex: 1,
  },
});
