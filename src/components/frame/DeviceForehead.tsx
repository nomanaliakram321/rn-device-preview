import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface DeviceForeheadProps {
  width: number;
  height: number;
  color: string;
  /** Phone (default): off-center camera + centered earpiece speaker grille,
   * matching classic iPhone SE/8-style layout. Tablet: a home-button iPad's
   * front camera is dead-center on the bezel with no visible speaker slit
   * (the iPad's speakers live on its sides/bottom, not this bezel). */
  formFactor?: 'phone' | 'tablet';
}

/**
 * The black bezel strip above the screen on classic home-button phones and
 * tablets (camera dot + speaker grille), rendered as its own block ABOVE
 * the screen — unlike a notch/Dynamic-Island/punch-hole, which are cut INTO
 * the display and drawn by `DeviceBezelOverlay` instead. Only used for
 * devices with `notch: 'none'` and `homeIndicator: 'physical-button'`
 * (see `DeviceFrame`), matching how those devices actually look: a solid
 * bezel "forehead" housing the earpiece/camera, not an on-screen cutout.
 */
export function DeviceForehead({ width, height, color, formFactor = 'phone' }: DeviceForeheadProps) {
  const isTablet = formFactor === 'tablet';
  return (
    <View testID="device-forehead" style={[styles.forehead, { width, height, backgroundColor: color }]}>
      <View
        testID="device-forehead-camera"
        style={[styles.camera, isTablet ? styles.cameraCentered : styles.cameraOffCenter]}
      />
      {!isTablet && <View testID="device-forehead-speaker" style={styles.speaker} />}
    </View>
  );
}

const styles = StyleSheet.create({
  forehead: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3a3a3a',
  },
  cameraOffCenter: {
    left: '38%',
    top: '58%',
  },
  cameraCentered: {
    left: '50%',
    top: '50%',
    marginLeft: -3,
    marginTop: -3,
  },
  speaker: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3a3a3a',
  },
});
