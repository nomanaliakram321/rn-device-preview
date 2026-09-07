import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useDevicePreview } from '../context/DevicePreviewContext';
import { getAllDevicePresets, applyDeviceFromJson } from '../devices/registry';
import { groupByFormFactor } from '../devices/grouping';
import { DevicePlatform, FormFactor } from '../devices/types';
import { ToolDefinition } from '../plugins/types';
import { SettingsGearIcon } from './frame/SettingsGearIcon';
import { PlatformTabIcon, FormFactorIcon } from './frame/PlatformIcons';

const PLATFORM_TABS: { key: DevicePlatform; label: string }[] = [
  { key: 'ios', label: 'iOS' },
  { key: 'android', label: 'Android' },
  { key: 'custom', label: 'Custom' },
];

const FORM_FACTOR_ORDER: FormFactor[] = ['phone', 'tablet'];

const BACKGROUND_SWATCHES = ['#f2f2f2', '#000000', '#ffffff', '#1c1c1e', '#2f7bf6'];

export interface SettingsPanelProps {
  tools?: ToolDefinition[];
}

/**
 * Bottom-sheet style control panel — mirrors the "Device model" /
 * "Device preview" panels from the Flutter package's screenshots:
 * platform tabs (grouped by form factor), orientation, theme,
 * font scale, the Phase B accessibility/preview-settings rows, and a
 * TOOLS section (Phase D) whose rows push a sub-page with a back arrow.
 */
export function SettingsPanel({ tools = [] }: SettingsPanelProps) {
  const preview = useDevicePreview();
  const [activePlatform, setActivePlatform] = useState<DevicePlatform>(
    preview?.device.platform ?? 'ios'
  );
  const [activeTool, setActiveTool] = useState<string | null>(null);
  // Bumped after registerCustomDevice/applyDeviceFromJson so groupedForPlatform
  // recomputes — the registry is a plain module-level array, not React state,
  // so nothing else would tell this component a new device was registered.
  const [registryVersion, bumpRegistryVersion] = useReducer((c: number) => c + 1, 0);

  // Keep the active tab in sync with whichever device is actually selected —
  // e.g. persisted preferences restoring a non-iOS device after this
  // component already mounted with the 'ios' default.
  useEffect(() => {
    if (preview?.device.platform) setActivePlatform(preview.device.platform);
  }, [preview?.device.platform]);

  const groupedForPlatform = useMemo(() => {
    const presetsForPlatform = getAllDevicePresets().filter((p) => p.platform === activePlatform);
    return groupByFormFactor(presetsForPlatform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlatform, registryVersion]);

  const isSettingsPanelOpen = preview?.isSettingsPanelOpen ?? false;

  // Always reopen at the root panel — a tool page left open from a previous
  // session would otherwise persist across close/reopen, which doesn't match
  // any of the reference screenshots' panel-chrome behavior.
  useEffect(() => {
    if (!isSettingsPanelOpen) setActiveTool(null);
  }, [isSettingsPanelOpen]);

  // RN's Modal animationType="slide" translates the backdrop and the sheet
  // together as one block, which reads as a flat, non-native slide. Real
  // iOS/Android bottom sheets fade the backdrop independently while the
  // sheet springs up on its own — driven here so the Modal itself stays
  // static (animationType="none") and unmounts only once the close
  // animation finishes.
  const [modalVisible, setModalVisible] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Skips the close animation on initial mount — with modalVisible already
  // false there is nothing on screen to animate out, and starting it anyway
  // just leaves a dangling timer (surfaces as torn-down-environment errors
  // in tests that never open the panel).
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (!isSettingsPanelOpen) return;
    }

    let animation: Animated.CompositeAnimation;
    if (isSettingsPanelOpen) {
      setModalVisible(true);
      sheetTranslateY.setValue(Dimensions.get('window').height);
      backdropOpacity.setValue(0);
      animation = Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          mass: 0.9,
          stiffness: 240,
        }),
      ]);
      animation.start();
    } else {
      animation = Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: Dimensions.get('window').height,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);
      animation.start(() => setModalVisible(false));
    }
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsPanelOpen]);

  if (!preview) return null;

  const {
    toggleSettingsPanel,
    device,
    setDevice,
    orientation,
    setOrientation,
    theme,
    setTheme,
    fontScale,
    setFontScale,
    boldText,
    setBoldText,
    frameVisible,
    setFrameVisible,
    enabled,
    setEnabled,
    accessibleNavigation,
    setAccessibleNavigation,
    invertColors,
    setInvertColors,
    backgroundColor,
    setBackgroundColor,
    virtualKeyboardVisible,
    setVirtualKeyboardVisible,
  } = preview;

  const openTool = tools.find((tool) => tool.id === activeTool) ?? null;

  const [jsonFormOpen, setJsonFormOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const submitDeviceJson = () => {
    try {
      const preset = applyDeviceFromJson(jsonInput);
      bumpRegistryVersion();
      setDevice(preset);
      setJsonInput('');
      setJsonError(null);
      setJsonFormOpen(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid device definition.');
    }
  };

  const [customWidth, setCustomWidth] = useState(640);
  const [customHeight, setCustomHeight] = useState(1024);
  const [customPixelRatio, setCustomPixelRatio] = useState(2);

  const applyCustomSize = (overrides: Partial<{ width: number; height: number; pixelRatio: number }>) => {
    const width = overrides.width ?? customWidth;
    const height = overrides.height ?? customHeight;
    const pixelRatio = overrides.pixelRatio ?? customPixelRatio;
    setCustomWidth(width);
    setCustomHeight(height);
    setCustomPixelRatio(pixelRatio);
    setDevice({
      id: 'custom-live',
      name: 'Custom',
      platform: 'custom',
      formFactor: 'phone',
      width,
      height,
      pixelRatio,
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      notch: 'none',
      homeIndicator: 'none',
    });
  };

  return (
    <>
      <View style={styles.toggleBar}>
        <Pressable
          testID="device-preview-toggle-button"
          onPress={toggleSettingsPanel}
          style={styles.toggleButton}
        >
          <SettingsGearIcon size={16} color="#ffffff" />
          <Text style={styles.toggleButtonText}>Device Preview</Text>
        </Pressable>
        <Switch testID="device-preview-enabled-switch" value={enabled} onValueChange={setEnabled} />
      </View>

      <Modal
        visible={modalVisible}
        animationType="none"
        transparent
        onRequestClose={toggleSettingsPanel}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={toggleSettingsPanel}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </Pressable>
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
          >
            <View style={styles.grabber} />
            {openTool ? (
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setActiveTool(null)} testID="tool-back-button">
                <Text style={styles.closeButton}>←</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>{openTool.label}</Text>
              <View style={styles.headerSpacer} />
            </View>
          ) : (
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Device Preview</Text>
              <Pressable onPress={toggleSettingsPanel}>
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>
          )}

          {openTool ? (
            <ScrollView contentContainerStyle={styles.sheetContent}>{openTool.render()}</ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sectionLabel}>DEVICE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformTabs}>
                {PLATFORM_TABS.map((tab) => (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActivePlatform(tab.key)}
                    style={[styles.platformTab, activePlatform === tab.key && styles.platformTabActive]}
                  >
                    <PlatformTabIcon
                      platform={tab.key}
                      size={14}
                      color={activePlatform === tab.key ? '#ffffff' : '#999999'}
                    />
                    <Text
                      style={[
                        styles.platformTabText,
                        activePlatform === tab.key && styles.platformTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {FORM_FACTOR_ORDER.filter((formFactor) => groupedForPlatform[formFactor]?.length).map(
                (formFactor) => (
                  <View key={formFactor}>
                    <Text style={styles.formFactorLabel}>{formFactor.toUpperCase()}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {groupedForPlatform[formFactor]!.map((preset) => (
                        <Pressable
                          key={preset.id}
                          onPress={() => setDevice(preset)}
                          style={[
                            styles.deviceChip,
                            preset.id === device.id && styles.deviceChipActive,
                          ]}
                        >
                          <View style={styles.deviceChipTitleRow}>
                            <FormFactorIcon
                              formFactor={preset.formFactor}
                              size={16}
                              color={preset.id === device.id ? '#ffffff' : '#999999'}
                            />
                            <Text
                              style={[
                                styles.deviceChipText,
                                preset.id === device.id && styles.deviceChipTextActive,
                              ]}
                            >
                              {preset.name}
                            </Text>
                          </View>
                          <Text style={styles.deviceChipSub}>
                            {preset.width}x{preset.height} @{preset.pixelRatio}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )
              )}

              {activePlatform === 'custom' && (
                <>
                  <Text style={styles.sectionLabel}>CUSTOM SIZE</Text>
                  <Row label={`Width: ${customWidth}px`}>
                    <Stepper
                      decrementTestID="custom-width-decrement"
                      incrementTestID="custom-width-increment"
                      onDecrement={() => applyCustomSize({ width: Math.max(100, customWidth - 10) })}
                      onIncrement={() => applyCustomSize({ width: customWidth + 10 })}
                    />
                  </Row>
                  <Row label={`Height: ${customHeight}px`}>
                    <Stepper
                      decrementTestID="custom-height-decrement"
                      incrementTestID="custom-height-increment"
                      onDecrement={() => applyCustomSize({ height: Math.max(100, customHeight - 10) })}
                      onIncrement={() => applyCustomSize({ height: customHeight + 10 })}
                    />
                  </Row>
                  <Row label={`Pixel ratio: ${customPixelRatio.toFixed(2)}`}>
                    <Stepper
                      decrementTestID="custom-pixel-ratio-decrement"
                      incrementTestID="custom-pixel-ratio-increment"
                      onDecrement={() =>
                        applyCustomSize({ pixelRatio: Math.max(1, Number((customPixelRatio - 0.25).toFixed(2))) })
                      }
                      onIncrement={() =>
                        applyCustomSize({ pixelRatio: Math.min(4, Number((customPixelRatio + 0.25).toFixed(2))) })
                      }
                    />
                  </Row>
                </>
              )}

              {activePlatform === 'custom' && (
                <View>
                  <Pressable
                    testID="new-device-json-toggle"
                    onPress={() => setJsonFormOpen((v) => !v)}
                    style={styles.jsonToggle}
                  >
                    <Text style={styles.jsonToggleText}>
                      {jsonFormOpen ? '– Cancel' : '+ New device from JSON…'}
                    </Text>
                  </Pressable>
                  {jsonFormOpen && (
                    <View>
                      <TextInput
                        testID="new-device-json-input"
                        style={styles.jsonInput}
                        multiline
                        placeholder='{"id": "my-device", "name": "My Device", "platform": "custom", "formFactor": "phone", "width": 400, "height": 800, "pixelRatio": 2, "insets": {"top": 0, "bottom": 0, "left": 0, "right": 0}, "notch": "punch-hole", "homeIndicator": "gesture-pill"}'
                        placeholderTextColor="#666"
                        value={jsonInput}
                        onChangeText={setJsonInput}
                      />
                      {jsonError && (
                        <Text testID="new-device-json-error" style={styles.jsonError}>
                          {jsonError}
                        </Text>
                      )}
                      <Pressable
                        testID="new-device-json-submit"
                        onPress={submitDeviceJson}
                        style={styles.jsonSubmit}
                      >
                        <Text style={styles.jsonSubmitText}>Add device</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.sectionLabel}>SCREEN</Text>
              <Row label="Orientation">
                <SegmentedToggle
                  options={['portrait', 'landscape']}
                  value={orientation}
                  onChange={(v) => setOrientation(v as 'portrait' | 'landscape')}
                />
              </Row>

              <Row label="Theme">
                <SegmentedToggle
                  options={['light', 'dark']}
                  value={theme}
                  onChange={(v) => setTheme(v as 'light' | 'dark')}
                />
              </Row>

              <Text style={styles.sectionLabel}>ACCESSIBILITY</Text>
              <Row label="Bold text">
                <Switch value={boldText} onValueChange={setBoldText} />
              </Row>

              <Row label={`Text scaling factor: ${fontScale.toFixed(2)}`}>
                <View style={styles.scaleButtons}>
                  <Pressable
                    onPress={() => setFontScale(Math.max(0.7, fontScale - 0.1))}
                    style={styles.scaleButton}
                  >
                    <Text style={styles.scaleButtonText}>A-</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFontScale(Math.min(2, fontScale + 0.1))}
                    style={styles.scaleButton}
                  >
                    <Text style={styles.scaleButtonText}>A+</Text>
                  </Pressable>
                </View>
              </Row>

              <Row label="Accessible navigation">
                <Switch value={accessibleNavigation} onValueChange={setAccessibleNavigation} />
              </Row>

              <Row label="Invert colors">
                <Switch value={invertColors} onValueChange={setInvertColors} />
              </Row>

              <Text style={styles.sectionLabel}>PREVIEW SETTINGS</Text>
              <Row label="Frame visibility">
                <Switch
                  testID="frame-visible-switch"
                  value={frameVisible}
                  onValueChange={setFrameVisible}
                />
              </Row>

              <Row label="Virtual keyboard preview">
                <Switch
                  testID="virtual-keyboard-switch"
                  value={virtualKeyboardVisible}
                  onValueChange={setVirtualKeyboardVisible}
                />
              </Row>

              <Row label="Background color">
                <View style={styles.swatchRow}>
                  {BACKGROUND_SWATCHES.map((swatch) => (
                    <Pressable
                      key={swatch}
                      onPress={() => setBackgroundColor(swatch)}
                      style={[
                        styles.swatch,
                        { backgroundColor: swatch },
                        backgroundColor === swatch && styles.swatchActive,
                      ]}
                    />
                  ))}
                </View>
              </Row>

              {tools.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>TOOLS</Text>
                  {tools.map((tool) => (
                    <Pressable
                      key={tool.id}
                      testID={`tool-row-${tool.id}`}
                      onPress={() => setActiveTool(tool.id)}
                      style={styles.toolRow}
                    >
                      <Text style={styles.toolRowIcon}>{tool.icon}</Text>
                      <Text style={styles.toolRowLabel}>{tool.label}</Text>
                      <Text style={styles.toolRowChevron}>›</Text>
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(opt)}
          style={[styles.segment, value === opt && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === opt && styles.segmentTextActive]}>
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Stepper({
  onDecrement,
  onIncrement,
  decrementTestID,
  incrementTestID,
}: {
  onDecrement: () => void;
  onIncrement: () => void;
  decrementTestID: string;
  incrementTestID: string;
}) {
  return (
    <View style={styles.scaleButtons}>
      <Pressable testID={decrementTestID} onPress={onDecrement} style={styles.scaleButton}>
        <Text style={styles.scaleButtonText}>−</Text>
      </Pressable>
      <Pressable testID={incrementTestID} onPress={onIncrement} style={styles.scaleButton}>
        <Text style={styles.scaleButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleBar: {
    height: 56,
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  toggleButton: { flexDirection: 'row', alignItems: 'center' },
  toggleButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#48484a',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  headerSpacer: { width: 20 },
  sheetTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  closeButton: { color: '#fff', fontSize: 18 },
  sheetContent: { padding: 16 },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  platformTabs: { marginBottom: 8 },
  platformTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    marginRight: 8,
  },
  platformTabActive: { backgroundColor: '#2f7bf6' },
  platformTabText: { color: '#999', fontWeight: '600' },
  platformTabTextActive: { color: '#fff' },
  formFactorLabel: { color: '#666', fontSize: 11, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  deviceChip: {
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
    minWidth: 130,
  },
  deviceChipActive: { backgroundColor: '#2f7bf6' },
  deviceChipTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deviceChipText: { color: '#fff', fontWeight: '600' },
  deviceChipTextActive: { color: '#fff' },
  deviceChipSub: { color: '#999', fontSize: 12, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  rowLabel: { color: '#fff', fontSize: 15 },
  segmented: { flexDirection: 'row', backgroundColor: '#2c2c2e', borderRadius: 8 },
  segment: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  segmentActive: { backgroundColor: '#2f7bf6' },
  segmentText: { color: '#999', textTransform: 'capitalize' },
  segmentTextActive: { color: '#fff' },
  scaleButtons: { flexDirection: 'row', gap: 8 },
  scaleButton: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scaleButtonText: { color: '#fff', fontWeight: '700' },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  swatchActive: { borderColor: '#fff', borderWidth: 2 },
  jsonToggle: { paddingVertical: 10 },
  jsonToggleText: { color: '#2f7bf6', fontWeight: '600' },
  jsonInput: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  jsonError: { color: '#ff453a', marginBottom: 8 },
  jsonSubmit: {
    backgroundColor: '#2f7bf6',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  jsonSubmitText: { color: '#fff', fontWeight: '700' },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  toolRowIcon: { fontSize: 18, marginRight: 12 },
  toolRowLabel: { color: '#fff', fontSize: 15, flex: 1 },
  toolRowChevron: { color: '#666', fontSize: 18 },
});
