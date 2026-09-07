import React, { ReactNode, useEffect, useState } from 'react';
import { View, SafeAreaView, StyleSheet, LayoutChangeEvent, Platform, StatusBar } from 'react-native';
import { useDevicePreview } from '../context/DevicePreviewContext';
import { SimulatedKeyboard } from './SimulatedKeyboard';
import { updatePreviewSnapshot } from '../keyboard/previewSnapshot';
import { getBezelStyle } from './frame/bezelStyles';
import { DeviceBezelOverlay } from './frame/DeviceBezelOverlay';
import { DeviceSideButtons } from './frame/DeviceSideButtons';
import { DeviceForehead } from './frame/DeviceForehead';
import { DeviceBezelCamera } from './frame/DeviceBezelCamera';

export interface DeviceFrameProps {
  children: ReactNode;
}

// RN's SafeAreaView only applies inset padding on iOS; on Android it's a
// plain View. StatusBar.currentHeight (Android-only, undefined on iOS) is
// the standard way to reserve that space manually.
const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

/**
 * Renders `children` at the simulated device's real pixel size, then scales
 * the whole thing down (or up) to fit the host screen — the same visual
 * trick as Flutter's device_frame_plus. When disabled, just renders
 * children directly with no wrapping.
 */
export function DeviceFrame({ children }: DeviceFrameProps) {
  const preview = useDevicePreview();
  // The actual laid-out space available for the frame, measured directly
  // off the inner container instead of derived from useWindowDimensions()
  // with guessed-at reservations for the toggle bar and safe-area insets.
  // Those are real but variable (differ per device/orientation), and
  // getting the guess wrong under-fits or over-fits the frame — over-fit
  // means the bottom (e.g. the home-button chin's circle) renders past the
  // visible area and gets clipped behind the toggle bar. Measuring this
  // container (a flex:1 child of the SafeAreaView, so its layout already
  // excludes both the toggle bar sibling and the safe-area padding) is
  // exact regardless of device, orientation, or host chrome.
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  // These derived values fall back to safe defaults (0 / 1) when there's no
  // active preview, so they can be referenced unconditionally by the
  // `useEffect` below — which itself MUST run on every render, never behind
  // the early `return` further down. If the effect were declared after that
  // early return, toggling `enabled` at runtime (the SettingsPanel toggle
  // bar's master Switch) would change the number of hooks called between
  // renders of this same component instance and crash React with "Rendered
  // fewer hooks than expected." Guarding what the effect DOES (via
  // `isPreviewActive` inside its body) rather than whether the hook is
  // called at all keeps Rules of Hooks intact.
  const orientation = preview?.orientation;
  const device = preview?.device;
  const isLandscape = orientation === 'landscape';
  const simWidth = device ? (isLandscape ? device.height : device.width) : 0;
  const simHeight = device ? (isLandscape ? device.width : device.height) : 0;
  const isPreviewActive = !!preview && preview.enabled;

  // Computed early (alongside simWidth/simHeight above) because the scale
  // fit below MUST account for them: the frame wrapper's total height is
  // foreheadHeight + simHeight + chinHeight (see the render below), not
  // simHeight alone. Using simHeight alone here previously under-scaled
  // the fit for any home-button device — the wrapper rendered taller than
  // the space it was scaled to fit into, so its bottom (e.g. the chin's
  // circle) overflowed past the visible area and got clipped behind the
  // toggle bar.
  const showHomeButtonChin = !!preview?.frameVisible && device?.homeIndicator === 'physical-button';
  const chinHeight = showHomeButtonChin ? 64 : 0;
  const showForehead = showHomeButtonChin && device?.notch === 'none';
  const foreheadHeight = showForehead ? 56 : 0;
  const totalSimHeight = foreheadHeight + simHeight + chinHeight;

  // Leave room for the frame wrapper's own marginTop clearance from the top
  // of this container (16, see below). Clamped to a minimum of 1: a
  // container shorter than that (not yet laid out, or a genuinely tiny
  // host) would otherwise make this negative, and Math.min below would then
  // pick that negative ratio over the positive alternatives, rendering the
  // simulated viewport mirrored/inverted instead of just very small.
  const availableHeight = Math.max(containerSize.height - 16, 1);
  const scale =
    isPreviewActive && simWidth > 0 && totalSimHeight > 0 && containerSize.width > 0
      ? Math.max(Math.min(containerSize.width / simWidth, availableHeight / totalSimHeight, 1), 0.01)
      : 1;

  // Publish the current fit-to-host scale + simulated dimensions so the
  // keyboard bridge (running outside the React tree) can map a real host
  // keyboard's height/position into the simulated viewport's own coordinate
  // space. No-op while the preview is disabled.
  useEffect(() => {
    if (!isPreviewActive) return;
    updatePreviewSnapshot({ scale, deviceWidth: simWidth, deviceHeight: simHeight });
  }, [isPreviewActive, scale, simWidth, simHeight]);

  if (!preview || !preview.enabled) {
    return <>{children}</>;
  }

  const { device: activeDevice, frameVisible, virtualKeyboardVisible } = preview;
  const bezel = getBezelStyle(activeDevice);
  // The ancestor clip view's overflow:'hidden' + borderRadius rounds the
  // OUTER silhouette, but a corner where the screen view's own borderWidth
  // is close to that radius can still leak a sliver of its white background
  // content past the curve — the border stroke and the clip mask live on
  // different native layers and don't perfectly agree at the diagonal.
  // Giving the screen view its OWN matching radius on every free corner (0
  // on any edge that instead abuts the forehead/chin, which supply that
  // corner's squareness themselves) puts the mask and the border stroke on
  // the same layer, closing the leak.
  const topCornerRadius = frameVisible && !showForehead ? bezel.borderRadius : 0;
  const bottomCornerRadius = frameVisible && !showHomeButtonChin ? bezel.borderRadius : 0;

  return (
    // SafeAreaView (not a plain View) so that when this itself runs inside a
    // real notched/Dynamic-Island host (e.g. testing in the iOS Simulator),
    // the whole simulated frame — including its own drawn notch/island — is
    // pushed clear of the HOST's hardware cutout, instead of rendering the
    // simulated frame's top edge underneath/behind it. React Native's
    // SafeAreaView is a no-op on Android (it only applies inset padding on
    // iOS), so ANDROID_STATUS_BAR_HEIGHT below covers Android explicitly —
    // without it, the frame's own top border/notch/punch-hole render flush
    // under the real status bar instead of clear of it.
    <SafeAreaView
      testID="device-preview-frame-host"
      style={[
        styles.safeArea,
        { backgroundColor: preview.backgroundColor || '#f2f2f2', paddingTop: ANDROID_STATUS_BAR_HEIGHT },
      ]}
    >
      {/* Measuring THIS container (not the SafeAreaView above it) is what
          makes containerSize exact: as a flex:1 child, its laid-out size
          already excludes both the SafeAreaView's own safe-area padding and
          the SettingsPanel toggle-bar sibling's height — no guessing. */}
      <View style={styles.host} onLayout={handleContainerLayout}>
      {/* transform:scale lives on this wrapper (not the screen view itself)
          so the screen view and the home-button chin below it scale
          together as one rigid unit — a transform on the screen view alone
          wouldn't affect the chin's layout position, causing a visual gap
          between them.

          The rounding + clipping for the WHOLE unibody shape (screen + chin)
          also lives here, as a single uniform borderRadius, rather than on
          the screen view itself. React Native's overflow clipping on iOS
          masks children using one uniform corner radius (a CALayer
          cornerRadius); giving the screen view itself MIXED per-corner radii
          (rounded top, square bottom, so the chin below could butt flush
          against it) draws the border stroke correctly but does NOT clip
          the content the same way — the content's actual corner stays
          square and pokes out past the curve into the gray background.
          Clipping the whole wrapper to one uniform radius sidesteps that
          bug entirely and, as a bonus, is what actually makes the screen +
          chin clip as one continuous shape. */}
      <View
        style={{
          width: simWidth,
          height: foreheadHeight + simHeight + chinHeight,
          marginTop: 16,
          transform: [{ scale }],
        }}
      >
        {/* Rounded-corner clipping lives on THIS inner view (screen + chin +
            forehead only), not the outer wrapper above — DeviceSideButtons
            is a sibling of this one, outside its overflow:'hidden', so its
            buttons can render with a negative left/right offset and
            actually poke out past the frame's outer silhouette like real
            hardware buttons, instead of being clipped flush with it. */}
        <View
          style={{
            width: simWidth,
            height: foreheadHeight + simHeight + chinHeight,
            borderRadius: frameVisible ? bezel.borderRadius : 0,
            overflow: 'hidden',
          }}
        >
          {showForehead && (
            <DeviceForehead
              width={simWidth}
              height={foreheadHeight}
              color={bezel.borderColor}
              formFactor={activeDevice.formFactor}
            />
          )}
          {frameVisible &&
            activeDevice.formFactor === 'tablet' &&
            activeDevice.notch === 'none' &&
            !showForehead && <DeviceBezelCamera borderWidth={bezel.borderWidth} />}
          <View
          style={[
            styles.simulatedViewport,
            {
              width: simWidth,
              height: simHeight,
              borderWidth: frameVisible ? bezel.borderWidth : 0,
              // No bottom border when a chin follows immediately below, and
              // no top border when a forehead precedes it above — each of
              // those supplies that shared edge itself, in the same color.
              borderBottomWidth: frameVisible && !showHomeButtonChin ? bezel.borderWidth : 0,
              borderTopWidth: frameVisible && !showForehead ? bezel.borderWidth : 0,
              borderColor: bezel.borderColor,
              borderTopLeftRadius: topCornerRadius,
              borderTopRightRadius: topCornerRadius,
              borderBottomLeftRadius: bottomCornerRadius,
              borderBottomRightRadius: bottomCornerRadius,
            },
          ]}
        >
          {children}
          {virtualKeyboardVisible && <SimulatedKeyboard />}
          {frameVisible && (
            <DeviceBezelOverlay device={activeDevice} width={simWidth} height={simHeight} />
          )}
          </View>
          {showHomeButtonChin && (
            <View
              testID="device-frame-home-button-chin"
              style={[
                styles.homeButtonChin,
                { width: simWidth, height: chinHeight, backgroundColor: bezel.borderColor },
              ]}
            >
              <View style={styles.homeButtonCircle} />
            </View>
          )}
        </View>
        {frameVisible && (
          <DeviceSideButtons device={activeDevice} width={simWidth} height={simHeight} />
        )}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  host: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedViewport: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  homeButtonChin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#555555',
  },
});
