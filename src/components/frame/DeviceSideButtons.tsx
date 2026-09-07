import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DevicePreset } from '../../devices/types';

export interface DeviceSideButtonsProps {
  device: DevicePreset;
  width: number;
  height: number;
}

interface ButtonSpec {
  side: 'left' | 'right' | 'top';
  // Vertical offset from the top edge for a 'left'/'right' bump; horizontal
  // offset from the left edge for a 'top' bump.
  offset: number;
  length: number;
}

// Generic hand-drawn button placement, proportioned off the simulated
// screen height rather than fixed points — real iPhones/Android phones put
// the mute switch/volume rocker/power button at roughly these fractions of
// screen height regardless of exact model, and this keeps them sane across
// the whole size range (iPhone SE through Pro Max) without per-device data.
function buttonLayout(device: DevicePreset, height: number, width: number): ButtonSpec[] {
  if (device.formFactor === 'tablet') {
    // Modern (Face ID / USB-C) iPads and Android tablets alike put the
    // volume rocker on the right edge near the top and the power/top
    // button on the top edge toward the right corner — not on the left
    // edge at all, unlike phones.
    return [
      { side: 'right', offset: height * 0.06, length: 40 },
      { side: 'right', offset: height * 0.06 + 46, length: 40 },
      { side: 'top', offset: width * 0.68, length: 50 },
    ];
  }
  if (device.platform === 'android') {
    return [
      { side: 'right', offset: height * 0.16, length: 70 },
      { side: 'right', offset: height * 0.16 + 84, length: 36 },
    ];
  }
  // iOS (and any other non-Android phone platform, e.g. a custom device)
  return [
    { side: 'left', offset: height * 0.1, length: 22 }, // ring/mute switch
    { side: 'left', offset: height * 0.1 + 40, length: 50 }, // volume up
    { side: 'left', offset: height * 0.1 + 100, length: 50 }, // volume down
    { side: 'right', offset: height * 0.14, length: 80 }, // side/power button
  ];
}

/**
 * Draws hand-drawn generic button bumps (volume rocker/mute switch/power
 * button) inset into the device frame's left/right/top border — matching
 * how real phones and tablets look, same spirit as the notch/island/
 * punch-hole shapes in `DeviceBezelOverlay`. Rendered as a sibling of the
 * frame's screen content view (not inside it) so the buttons aren't
 * clipped by its `overflow: hidden`.
 */
export function DeviceSideButtons({ device, width, height }: DeviceSideButtonsProps) {
  const buttons = buttonLayout(device, height, width);
  const color = '#000000';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="device-side-buttons">
      {buttons.map((button, index) => (
        <View
          key={index}
          testID={`device-side-button-${button.side}-${index}`}
          style={[
            styles.button,
            button.side === 'left' && styles.left,
            button.side === 'right' && styles.right,
            button.side === 'top' && styles.top,
            button.side === 'top'
              ? { left: button.offset, width: button.length, height: 5 + PROTRUSION }
              : { top: button.offset, height: button.length },
            { backgroundColor: color },
          ]}
        />
      ))}
    </View>
  );
}

// Pokes out past the frame's outer silhouette, like a real raised button —
// `DeviceFrame` renders this component as a sibling OUTSIDE the frame's
// rounded-corner overflow:'hidden' clip specifically so this negative
// offset isn't clipped flush with the border instead.
const PROTRUSION = 3;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 5 + PROTRUSION,
    borderRadius: 2,
  },
  left: {
    left: -PROTRUSION,
  },
  right: {
    right: -PROTRUSION,
  },
  top: {
    top: -PROTRUSION,
  },
});
