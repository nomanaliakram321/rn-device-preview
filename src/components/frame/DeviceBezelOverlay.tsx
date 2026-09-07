import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { DevicePreset, NotchVariant } from '../../devices/types';

export interface DeviceBezelOverlayProps {
  device: DevicePreset;
  width: number;
  height: number;
}

// Sizes are clamped rather than pure width-ratios so the same formula
// produces a correctly-proportioned iPhone-scale notch (~350-450pt wide
// screens) AND a correctly-proportioned MacBook-scale camera notch
// (~1500pt wide screens) without needing a separate code path per form
// factor — real notches/islands/punch-holes don't scale linearly with
// screen width once you're in laptop territory.
//
// The 'narrow' multiplier is sourced from Apple's own published dimensions:
// the iPhone 13 Pro's notch measures 26.8mm wide vs the iPhone 12 Pro's
// 34.83mm — a real ~23% reduction Apple carried through 13/13 mini/13 Pro
// Max/14/14 Plus before switching the Pro line to Dynamic Island at 14 Pro.
function notchSize(width: number, height: number, variant: NotchVariant) {
  const widthMultiplier = variant === 'narrow' ? 0.385 : 0.5;
  const widthCap = variant === 'narrow' ? 170 : 220;
  return { width: Math.min(width * widthMultiplier, widthCap), height: Math.min(height * 0.035, 22) };
}
function islandSize(width: number, height: number) {
  return { width: Math.min(width * 0.3, 120), height: Math.min(height * 0.032, 26) };
}
function punchHoleRadius(width: number) {
  return Math.min(width * 0.02, 6);
}
function barSize(width: number, ratio: number, cap: number, thickness: number) {
  return { width: Math.min(width * ratio, cap), height: thickness };
}

// A small top offset (rather than starting flush at y=0) keeps the Dynamic
// Island / punch-hole shapes visually distinct from the host OS's own
// status-bar chrome when this runs inside a real device/simulator that
// already has its own hardware cutout — without it the two cutouts visually
// fuse into one blob. A real notch does NOT get this treatment: unlike an
// island or punch-hole (which sit inset within the display with a genuine
// gap above them), a notch is physically fused to the top bezel with zero
// gap — offsetting it down was the actual mismatch against real hardware.
const CUTOUT_TOP_OFFSET = 8;

function notchPath(notchWidth: number, notchHeight: number, containerWidth: number): string {
  const x = (containerWidth - notchWidth) / 2;
  const top = 0;
  const bottom = top + notchHeight;
  const radius = Math.min(14, notchHeight / 2);
  return `M ${x} ${top}
    L ${x} ${bottom - radius}
    Q ${x} ${bottom} ${x + radius} ${bottom}
    L ${x + notchWidth - radius} ${bottom}
    Q ${x + notchWidth} ${bottom} ${x + notchWidth} ${bottom - radius}
    L ${x + notchWidth} ${top}
    Z`;
}

/**
 * A camera-lens glyph: a mid-grey ring (catches light against the pure-black
 * cutout, same way a real TrueDepth/selfie lens reads as a distinct glassy
 * disc rather than vanishing into the bezel) with a darker pupil on top and
 * a small highlight dot for a hint of glass reflection.
 */
function CameraLens({ cx, cy, r, testID }: { cx: number; cy: number; r: number; testID: string }) {
  return (
    <>
      <Circle testID={testID} cx={cx} cy={cy} r={r} fill="#2c2c2e" />
      <Circle cx={cx} cy={cy} r={r * 0.6} fill="#050505" />
      <Circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.18} fill="#4a4a4d" opacity={0.7} />
    </>
  );
}

/**
 * Draws the hand-drawn generic top cutout (notch / Dynamic Island /
 * punch-hole camera) and bottom system-navigation indicator (swipe bar /
 * gesture pill) for the given device, ON TOP of the simulated content —
 * matching real hardware, where these are part of the display surface
 * itself, not separate bezel chrome. A physical home button is the one
 * exception (it's genuinely off-screen, in the bezel chin below the
 * display) and is rendered separately by `DeviceFrame`, not here.
 */
export function DeviceBezelOverlay({ device, width, height }: DeviceBezelOverlayProps) {
  if (width <= 0 || height <= 0) return null;

  const { notch, homeIndicator, platform, notchVariant = 'wide', notchPosition = 'center' } = device;
  const cutoutColor = platform === 'android' ? '#0d0d0d' : '#000000';

  const notchDims = notchSize(width, height, notchVariant);
  const islandDims = islandSize(width, height);
  const holeRadius = punchHoleRadius(width);
  const swipeBar = barSize(width, 0.35, 160, 5);
  const gesturePill = barSize(width, 0.28, 140, 4);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        {notch === 'notch' && (
          <>
            <Path
              testID="bezel-notch"
              d={notchPath(notchDims.width, notchDims.height, width)}
              fill={cutoutColor}
            />
            <Rect
              testID="bezel-notch-speaker"
              x={(width - notchDims.width) / 2 + notchDims.width * 0.18}
              y={notchDims.height / 2 - 1.5}
              width={notchDims.width * 0.34}
              height={3}
              rx={1.5}
              fill="#1c1c1e"
            />
            <CameraLens
              testID="bezel-notch-camera"
              cx={(width - notchDims.width) / 2 + notchDims.width * 0.76}
              cy={notchDims.height / 2}
              r={Math.min(notchDims.height * 0.32, 6)}
            />
          </>
        )}
        {notch === 'dynamic-island' && (
          <>
            <Rect
              testID="bezel-dynamic-island"
              x={(width - islandDims.width) / 2}
              y={CUTOUT_TOP_OFFSET}
              width={islandDims.width}
              height={islandDims.height}
              rx={islandDims.height / 2}
              fill={cutoutColor}
            />
            <CameraLens
              testID="bezel-dynamic-island-camera"
              cx={(width - islandDims.width) / 2 + islandDims.width - islandDims.height * 0.62}
              cy={CUTOUT_TOP_OFFSET + islandDims.height / 2}
              r={Math.min(islandDims.height * 0.34, 7)}
            />
          </>
        )}
        {notch === 'punch-hole' && (
          <Circle
            testID="bezel-punch-hole"
            cx={notchPosition === 'left' ? width * 0.08 + holeRadius : width / 2}
            cy={CUTOUT_TOP_OFFSET + holeRadius}
            r={holeRadius}
            fill={cutoutColor}
          />
        )}

        {homeIndicator === 'swipe-bar' && (
          <Rect
            testID="bezel-swipe-bar"
            x={(width - swipeBar.width) / 2}
            y={height - 14}
            width={swipeBar.width}
            height={swipeBar.height}
            rx={swipeBar.height / 2}
            fill="#000000"
          />
        )}
        {homeIndicator === 'gesture-pill' && (
          <Rect
            testID="bezel-gesture-pill"
            x={(width - gesturePill.width) / 2}
            y={height - 12}
            width={gesturePill.width}
            height={gesturePill.height}
            rx={gesturePill.height / 2}
            fill="#9e9e9e"
          />
        )}
      </Svg>
    </View>
  );
}
