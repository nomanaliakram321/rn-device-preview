import React, { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  DevicePreviewContext,
  DevicePreviewContextValue,
  defaultState,
} from './DevicePreviewContext';
import { DevicePreset, Orientation, DevicePreviewState } from '../devices/types';
import { savePreferences, loadPreferences } from '../storage/persistPreferences';
import { keyboardBridge } from '../keyboard/keyboardBridge';
import { updatePreviewSnapshot } from '../keyboard/previewSnapshot';

export interface DevicePreviewProviderProps {
  children: ReactNode;
  /** Master switch — pass `!inProdMode` from your app, e.g. __DEV__ */
  enabled?: boolean;
  /** Skip loading last-used device/settings from disk */
  persist?: boolean;
}

export function DevicePreviewProvider({
  children,
  enabled = true,
  persist = true,
}: DevicePreviewProviderProps) {
  const [state, setState] = useState<DevicePreviewState>({ ...defaultState, enabled });
  const [isSettingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [hydrated, setHydrated] = useState(!persist);

  // Resync state.enabled whenever the `enabled` prop itself changes value —
  // useState's initializer only reads it once at mount, so a host that flips
  // a runtime kill-switch (`enabled={isDevMode}`) on a later render would
  // otherwise leave the preview silently stuck at its first mounted value,
  // defeating the documented master-switch contract. Guarded so it never
  // fights the internal settings-panel Switch, which changes state.enabled
  // without this prop changing.
  useEffect(() => {
    setState((prev) => (prev.enabled === enabled ? prev : { ...prev, enabled }));
  }, [enabled]);

  // Restore last session's settings once on mount.
  useEffect(() => {
    if (!persist) return;
    let cancelled = false;
    loadPreferences().then((saved) => {
      if (!cancelled && saved) {
        setState((prev) => ({ ...saved, enabled: prev.enabled }));
      }
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [persist]);

  // Persist on every change, after initial hydration completes.
  useEffect(() => {
    if (!hydrated || !persist) return;
    savePreferences(state);
  }, [state, hydrated, persist]);

  // Keep the cross-cutting preview snapshot (read by the keyboard bridge,
  // which runs outside the React tree) in sync with provider state.
  useEffect(() => {
    updatePreviewSnapshot({
      enabled: state.enabled,
      virtualKeyboardVisible: state.virtualKeyboardVisible,
    });
  }, [state.enabled, state.virtualKeyboardVisible]);

  // Install the keyboard bridge only while the preview is enabled, so a
  // disabled/never-enabled preview has zero effect on the host app's real
  // keyboard behavior.
  //
  // This must happen synchronously during render, not in a useEffect: a
  // child mounted in the same commit (e.g. KeyboardAvoidingView) calls
  // Keyboard.addListener from its own componentDidMount, which React fires
  // for children before any of the parent's effects (layout or passive) run.
  // An effect here would patch Keyboard.addListener too late, after such a
  // child already bound to the real, unpatched listener. install()/
  // uninstall() are idempotent (guarded by an internal `installed` flag), so
  // calling them on every render — including React 18 StrictMode's double
  // render — is safe.
  if (state.enabled) {
    keyboardBridge.install();
  } else {
    keyboardBridge.uninstall();
  }
  useEffect(() => {
    return () => {
      keyboardBridge.uninstall();
    };
  }, []);

  const setDevice = useCallback((device: DevicePreset) => {
    setState((prev) => ({ ...prev, device }));
  }, []);

  const setOrientation = useCallback((orientation: Orientation) => {
    setState((prev) => ({ ...prev, orientation }));
  }, []);

  const setLocale = useCallback((locale: string) => {
    setState((prev) => ({ ...prev, locale }));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const setFontScale = useCallback((fontScale: number) => {
    setState((prev) => ({ ...prev, fontScale }));
  }, []);

  const setBoldText = useCallback((boldText: boolean) => {
    setState((prev) => ({ ...prev, boldText }));
  }, []);

  const setFrameVisible = useCallback((frameVisible: boolean) => {
    setState((prev) => ({ ...prev, frameVisible }));
  }, []);

  const setEnabled = useCallback((enabledVal: boolean) => {
    setState((prev) => ({ ...prev, enabled: enabledVal }));
  }, []);

  const setAccessibleNavigation = useCallback((accessibleNavigation: boolean) => {
    setState((prev) => ({ ...prev, accessibleNavigation }));
  }, []);

  const setInvertColors = useCallback((invertColors: boolean) => {
    setState((prev) => ({ ...prev, invertColors }));
  }, []);

  const setBackgroundColor = useCallback((backgroundColor: string) => {
    setState((prev) => ({ ...prev, backgroundColor }));
  }, []);

  const setVirtualKeyboardVisible = useCallback((virtualKeyboardVisible: boolean) => {
    setState((prev) => ({ ...prev, virtualKeyboardVisible }));
  }, []);

  const toggleSettingsPanel = useCallback(() => {
    setSettingsPanelOpen((prev) => !prev);
  }, []);

  const value = useMemo<DevicePreviewContextValue>(
    () => ({
      ...state,
      setDevice,
      setOrientation,
      setLocale,
      setTheme,
      setFontScale,
      setBoldText,
      setFrameVisible,
      setEnabled,
      setAccessibleNavigation,
      setInvertColors,
      setBackgroundColor,
      setVirtualKeyboardVisible,
      toggleSettingsPanel,
      isSettingsPanelOpen,
    }),
    [
      state,
      isSettingsPanelOpen,
      setDevice,
      setOrientation,
      setLocale,
      setTheme,
      setFontScale,
      setBoldText,
      setFrameVisible,
      setEnabled,
      setAccessibleNavigation,
      setInvertColors,
      setBackgroundColor,
      setVirtualKeyboardVisible,
      toggleSettingsPanel,
    ]
  );

  return (
    <DevicePreviewContext.Provider value={value}>{children}</DevicePreviewContext.Provider>
  );
}
