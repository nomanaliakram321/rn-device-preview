# rn-device-preview — Build Specification

**Purpose of this document:** a complete feature inventory of the Flutter package
[`device_preview_plus`](https://pub.dev/packages/device_preview_plus) being cloned,
mapped feature-by-feature to a React Native implementation. Feed this whole file to
Cursor as the source of truth — it covers every documented feature, every screenshot
element observed, the underlying mechanism, and the RN equivalent, so nothing gets
silently dropped during implementation.

---

## 1. Source package identity

| Field | Value |
|---|---|
| Name | `device_preview_plus` |
| Type | Flutter package |
| Current version (at time of writing) | 2.9.2 |
| License | MIT |
| Repository | https://github.com/zeshuaro/device_preview_plus |
| Relationship | Fork of the original [`device_preview`](https://pub.dev/packages/device_preview) by aloisdeniel, kept up to date with newer Flutter versions |
| Tagline | "Approximate how your Flutter app looks and performs on another device" |
| Platforms supported | Android, iOS, Linux, macOS, web, Windows |
| Dependencies | `collection`, `device_frame_plus`, `flutter`, `flutter_localizations`, `freezed_annotation`, `json_annotation`, `provider`, `shared_preferences`, `web` |

---

## 2. How the Flutter package works (mechanism)

This matters because it explains *why* certain features are trivial in Flutter and
require extra work in RN — see §5.

```
Flutter (normal):  OS → Flutter Engine → WidgetsBinding → MediaQuery → Widget tree
Flutter (preview):  OS → Flutter Engine → [CUSTOM WidgetsBinding] → MediaQuery → Widget tree
                                                    ↑
                                    device_preview_plus injects here
```

- `DevicePreview` wraps the app root and swaps in a **custom `WidgetsBinding`** — the
  single layer Flutter's entire widget tree is contractually required to read screen
  metrics, safe areas, locale, brightness, text scale, and target platform from.
- Three required integration points in the consuming app's `MaterialApp`:
  - `useInheritedMediaQuery: true` — pulls `MediaQuery` from the widget tree (which
    DevicePreview controls) instead of directly from the engine
  - `builder: DevicePreview.appBuilder` — wraps every screen in the simulated device
    frame and injects the fake `MediaQuery`
  - `locale: DevicePreview.locale(context)` — feeds simulated locale into Flutter's
    localization system
- Because *every* Flutter widget is drawn by Flutter itself (Skia), not native OS
  widgets, one interception point fakes truth for the entire tree — including
  third-party Flutter widgets.
- The device bezel image is drawn by the companion package `device_frame_plus`, with
  scale-to-fit and pointer-coordinate translation math so touches on the real screen
  map correctly onto the simulated device's coordinate space.
- The settings panel is a separate widget tree using `provider` for state; every
  change mutates shared state and the whole app tree re-renders instantly.
- Custom devices are `DeviceInfo`/`DevicePreset` objects, definable in Dart
  (`registerPreset`) or as JSON (loaded via `applyJson` or the panel's
  "New device from JSON…" entry).
- `shared_preferences` persists the last-used device/settings between app runs.

---

## 3. Complete feature inventory (from docs + observed screenshots)

### 3.1 Core preview mechanics
- [ ] Wrap app root in a preview container; toggle preview on/off (`enabled` flag,
      typically bound to `!kReleaseMode` / `__DEV__`)
- [ ] Render app content inside a scaled, clipped "simulated viewport" matching the
      selected device's exact logical pixel dimensions
- [ ] Preserve app state when switching devices/orientation/settings (no full remount)
- [ ] Scale-to-fit math so the simulated device fits the host window regardless of
      host window size
- [ ] Device bezel/frame image rendered around the simulated viewport
- [ ] Toggle frame visibility on/off independent of preview being enabled

### 3.2 Device selection (observed in screenshots 1, 2, 6)
- [ ] "Device model" picker UI, tabbed by platform:
      **iOS**, **Android**, **Custom** — this port is mobile-only (no
      macOS/Windows/Linux desktop platform tabs; the Flutter reference
      package has them, this library deliberately doesn't)
- [ ] Each platform tab lists concrete device presets, each showing name +
      resolution + pixel ratio, e.g.:
  - iOS: `iPhone SE — 375x667 @2`, `iPhone 12 Mini — 375x812 @2`,
    `iPhone 13 Mini — 375x812 @2`
  - Android: phones and tablets, similarly labeled
- [ ] **Custom** tab: freeform device with live-adjustable sliders for:
  - Width (px) — observed default 640
  - Height (px) — observed default 1024
  - Pixel ratio — observed default 2
  - (also: safe area insets, per API docs)
- [ ] Devices grouped by form factor within a platform (phone / tablet) — not
      just a flat list
- [ ] `Devices` API class exposes device lists programmatically: `Devices.all`,
      `Devices.android`, `Devices.ios` — each a typed collection of `DeviceInfo`

### 3.3 Orientation
- [ ] Change device orientation (portrait ↔ landscape) live, swaps width/height and
      re-lays-out safe area insets accordingly

### 3.4 Dynamic system configuration (observed in screenshots 3, 4, 7)
- [ ] **Locale** — picker showing current locale (observed: "English (Pakistan)"),
      drill-in arrow to a full locale list; changes propagate to app's localization
- [ ] **Theme** — Light / Dark toggle (observed control labeled "Theme", value "Light")
- [ ] **Bold text** — on/off toggle (observed "Disabled"), simulates OS-level bold
      text accessibility setting
- [ ] **Text scaling factor** — numeric slider, default `1`, observed range roughly
      0.7–2.0 in comparable implementations; live-multiplies all text sizes
- [ ] **Accessible navigation** — on/off toggle (observed "Disabled"), simulates
      screen-reader/accessibility navigation mode
- [ ] **Invert colors** — on/off toggle, simulates OS color-inversion accessibility
      setting
- [ ] **Background color** — customizable background behind the device frame
      (observed as a settings row with a color swatch control)

### 3.5 Preview panel device/display settings (observed in screenshot 7)
- [ ] **Model** — shows currently selected device summary with icon + drill-in
- [ ] **Orientation** — Portrait/Landscape row with icon toggle
- [ ] **Frame visibility** — Visible/Hidden toggle, row icon changes accordingly
- [ ] **Virtual keyboard preview** — Hidden/Shown toggle; when shown, renders a
      simulated on-screen keyboard at the bottom of the simulated viewport so devs
      can check layouts that must accommodate it (`viewInsets` reflects the
      simulated keyboard, not the host's real keyboard)

### 3.6 Panel chrome / navigation (observed across all screenshots)
- [ ] Bottom-sheet style panel, dark themed, slides up from bottom
- [ ] Two panel "modes" observed:
  - **Sub-page mode** (e.g. "Device model", back arrow `←` in header, title, close
    returns to root panel)
  - **Root panel mode** (title "Device preview", `✕` close button, closes panel
    entirely)
- [ ] A persistent bottom toggle bar (screenshot 5) with:
  - Left icon (settings/sliders icon) — opens the panel
  - Label "Device Preview"
  - Right-side on/off switch — enables/disables the whole preview overlay
- [ ] Sectioned settings groups with all-caps section headers: `SCREEN`, `DEVICE`,
      `ACCESSIBILITY`, `PREVIEW SETTINGS`

### 3.7 Plugin system
- [ ] Extensible "tools" system — pass an array of tool widgets into `DevicePreview`
      via a `tools` parameter
- [ ] `DevicePreview.defaultTools` — the built-in tool set (device picker, system
      settings, etc.) can be spread and extended with custom tools, e.g.:
      ```dart
      tools: const [...DevicePreview.defaultTools, CustomPlugin()]
      ```
- [ ] Documented example built-in tools include **Screenshot** capture and
      **File explorer**
- [ ] Each tool defines its own panel section/page, following the same push/pop
      navigation pattern as "Device model"

### 3.8 Custom devices
- [ ] Register a custom device programmatically in code (`registerPreset`)
- [ ] Load a custom device definition from JSON (`applyJson`)
- [ ] "New device from JSON…" entry point directly in the panel UI, so end users
      (not just developers) can add devices at runtime
- [ ] `DeviceInfo` factory constructors for common device archetypes, e.g. generic
      laptop (`GenericLaptopFramePainter`, rotated safe areas) and generic tablet
      (`GenericTabletFramePainter`) — used to build custom presets without a bespoke
      frame image

### 3.9 Persistence
- [ ] Save last-used device, orientation, locale, theme, and all system-config
      toggles across app restarts
- [ ] Pluggable storage backend — documented storage options:
  - File-based JSON storage (persists across restarts)
  - In-memory-only storage (explicitly resets every fresh app start — useful for
    testing/demos where you don't want persistence)

### 3.10 Simulated system-level behavior (deeper mechanism notes)
- [ ] While a device is simulated, `viewInsets` (keyboard-driven layout insets)
      reflect the **simulated** keyboard only, never the host's real keyboard —
      i.e. previewing on a real phone must not let the host's own keyboard push
      content around; only the simulated one should
- [ ] The host device's own real keyboard, if present, still maps into the
      simulated coordinate space correctly, and the two insets never stack — the
      deeper (larger) inset always wins
- [ ] Simulation happens below the widget layer, so it transparently reaches
      `MediaQuery`, layout, gestures, and locale resolution with zero changes
      required to the consuming app's own widget tree (beyond the 3 setup lines)

### 3.11 SVG rendering
- [ ] An embedded, dependency-free SVG subset renderer is used internally to draw
      device frame artwork, and is also exported standalone for reuse
      (`package:device_preview/svg.dart`)
- [ ] *(Lower priority for RN clone — RN has native SVG rendering via
      `react-native-svg`; this is Flutter-specific plumbing that isn't needed.)*

### 3.12 Explicitly out of scope / stated limitations
- [ ] The package's own README states it is a **first-order approximation** —
      does not actually run the app on the target device/OS; timing, native
      rendering quirks, and hardware-specific behavior are not perfectly captured.
      **This same caveat applies to the RN clone, doubly so** — see §5.

---

## 4. Full settings/data model (consolidated)

This is the complete state shape observed + documented — use this as the single
source of truth for the RN context shape (extends what was scaffolded in Phase 2).

```
DevicePreviewState {
  enabled: boolean
  device: DevicePreset            // see below
  orientation: 'portrait' | 'landscape'
  locale: string                  // e.g. "en-PK"
  theme: 'light' | 'dark'
  fontScale: number                // e.g. 1.0
  boldText: boolean
  accessibleNavigation: boolean    // NEW — not yet in Phase 2 scaffold
  invertColors: boolean            // NEW — not yet in Phase 2 scaffold
  backgroundColor: string          // NEW — hex color behind device frame
  frameVisible: boolean
  virtualKeyboardVisible: boolean  // NEW — not yet in Phase 2 scaffold
}

DevicePreset {
  id: string
  name: string
  platform: 'ios' | 'android' | 'custom'
  formFactor: 'phone' | 'tablet'   // NEW — needed for grouping
  width: number
  height: number
  pixelRatio: number
  insets: { top, bottom, left, right }
  notch: 'none' | 'notch' | 'dynamic-island' | 'punch-hole'         // NEW — top cutout, drawn by DeviceBezelOverlay
  homeIndicator: 'none' | 'swipe-bar' | 'physical-button' | 'gesture-pill'  // NEW — bottom system nav
  frameAsset?: ImageSource
}
```

**Gap vs. Phase 2 scaffold delivered earlier:** `accessibleNavigation`,
`invertColors`, `backgroundColor`, `virtualKeyboardVisible`, and `formFactor`
grouping were not yet implemented — flag these as the next increment for Cursor.

---

## 5. Flutter → React Native feature mapping

| # | Flutter feature | RN feasibility | RN implementation approach |
|---|---|---|---|
| 1 | Custom `WidgetsBinding` intercepting `MediaQuery` globally | ⚠️ No single equivalent | Multiple targeted Context providers/hooks (see rows below) instead of one interception point — RN has no single chokepoint all rendering passes through |
| 2 | Screen size / device dimensions | ✅ Full | `useSimulatedDimensions()` hook overriding `useWindowDimensions()`; **also** intercept at native level (Kotlin/Swift module overriding `DisplayMetrics`/`UIScreen`) for libraries reading native APIs directly, bypassing JS |
| 3 | Pixel ratio | ✅ Full | Included in dimensions hook; native override for true fidelity |
| 4 | Orientation | ✅ Full | Context state swap, width/height + insets recompute |
| 5 | Safe area insets | ✅ Full (for RN-JS consumers) | `useSimulatedInsets()` wrapping `react-native-safe-area-context`'s provider |
| 6 | Locale | ⚠️ Partial | Full control over **app's own** i18n (i18next/react-intl) via `useSimulatedLocale()`; **cannot** override native OS locale for native components (native date pickers, etc. will always show real device locale) |
| 7 | Theme (light/dark) | ✅ Full | Trivial Context provider — most RN apps already do this |
| 8 | Text scaling factor | ✅ Full (JS scope) + ⚠️ native modules needed for full fidelity | `useSimulatedFontScale()` multiplies font sizes app-wide; native module override of `PixelRatio.getFontScale()` for components reading it directly |
| 9 | Bold text | ✅ Full | Context flag; consuming components switch `fontWeight` |
| 10 | Accessible navigation | ⚠️ Partial | Can simulate *your app's* focus-order/accessibility props reading this flag; cannot fake OS-level screen reader behavior |
| 11 | Invert colors | ✅ Full (JS scope) | CSS-filter-style color inversion via a wrapping `View` with platform-appropriate approach (Android: native module; iOS: native module) — **flag as native-module-required, not yet scaffolded** |
| 12 | Virtual keyboard preview + correct viewInsets behavior (simulated-only, never host's real keyboard) | ⚠️ Partial, needs care | Render a fake keyboard `View` at bottom of simulated viewport; must **suppress** RN's real `KeyboardAvoidingView`/native keyboard listeners while active so the host's real keyboard never double-applies — **not yet scaffolded, real complexity here** |
| 13 | Device frame / bezel rendering + scale-to-fit + pointer mapping | ✅ Full | `DeviceFrame` component (already scaffolded) — `transform: scale` + coordinate math; pointer mapping already correct since RN's touch system operates in the scaled view's local coordinate space automatically |
| 14 | Settings panel UI (bottom sheet, tabbed device picker, sectioned rows) | ✅ Full | `SettingsPanel` component (already scaffolded, needs device-grouping-by-form-factor added) |
| 15 | Plugin/tools system (`tools` prop, `defaultTools`, custom plugins) | ✅ Full | Not yet scaffolded — needs a `tools: ToolDefinition[]` prop on `<DevicePreview>`, each tool = `{ id, icon, panel: ReactNode }`, rendered as additional rows/pages in `SettingsPanel` |
| 16 | Screenshot tool (built-in plugin example) | ✅ Full | `react-native-view-shot` to capture the simulated viewport |
| 17 | File explorer tool (built-in plugin example) | ✅ Full, scope-limited | Can only browse app-accessible storage (RN sandbox), not full device filesystem — same practical limitation Flutter has on iOS/Android sandboxes anyway |
| 18 | Custom device registration (code + JSON) | ✅ Full | Extend `devicePresets` array at runtime; JSON loader = `JSON.parse` into `DevicePreset` shape with validation |
| 19 | "New device from JSON" in-panel UI | ✅ Full | A form screen in `SettingsPanel`, not yet scaffolded |
| 20 | Persistence (file-based vs in-memory pluggable storage) | ✅ Full | `AsyncStorage` (already scaffolded) = file-based equivalent; add a `persist={false}` in-memory-only mode (partially scaffolded via `persist` prop, needs the "explicitly reset every launch" semantics double-checked) |
| 21 | Embedded SVG renderer | ❌ Not needed | RN has native SVG support via `react-native-svg`; this was Flutter-specific plumbing to avoid a dependency, irrelevant in RN |
| 22 | True pixel-identical cross-platform rendering (iOS rendering exactly like Android or vice versa) | ❌ Not achievable | Structural limitation — RN hands rendering to real native OS widgets; only Flutter/Skia-based renderers can guarantee this. **Not a bug to fix, a permanent scope boundary.** |
| 23 | Third-party **native** components (camera, maps, native pickers) respecting simulated size/locale/theme | ❌ Not achievable | They read real native APIs directly in native code, bypassing both JS context and most native module overrides scoped to the RN bridge |

---

## 6. Build priority order for Cursor

Build in this order — each phase should be fully working and demoed before starting
the next:

### Phase A — Already scaffolded (verify, don't rebuild)
- `DevicePreviewProvider` + context (extend state shape per §4 gaps)
- `useSimulatedDimensions`, `useSimulatedInsets`, `useSimulatedLocale`,
  `useSimulatedFontScale`
- `DeviceFrame`, `SettingsPanel`, `DevicePreview` root component
- `devicePresets.ts` seed data (8 devices) — **extend with `formFactor` field
  per §3.2 (iOS/Android/Custom only — no macOS/Windows/Linux)**
- AsyncStorage persistence

### Phase B — State model completion (§4 gaps)
1. Add `accessibleNavigation`, `invertColors`, `backgroundColor`,
   `virtualKeyboardVisible` to `DevicePreviewState`
2. Add corresponding setters + `SettingsPanel` rows
3. Add `formFactor` grouping to device picker UI (group headers: Phone / Tablet)

### Phase C — Virtual keyboard simulation (§5 row 12 — hardest JS-only piece)
1. Fake keyboard `View` component, toggled by `virtualKeyboardVisible`
2. Intercept/suppress real `Keyboard` module listeners while preview is active, so
   `KeyboardAvoidingView`/`useAnimatedKeyboard` etc. in the consuming app respond
   only to the simulated keyboard state, not the host device's real keyboard
3. Verify: opening the *simulated* keyboard shifts simulated-viewport content up;
   opening the *host's real* keyboard (e.g. testing in the RN dev environment
   itself) does **not** double-apply

### Phase D — Plugin/tools system (§3.7, §5 row 15)
1. Define `ToolDefinition` type: `{ id, label, icon, render: () => ReactNode }`
2. Add `tools` prop to `<DevicePreview>`, default to a `defaultTools` array
   (device picker + system settings, matching Flutter's `DevicePreview.defaultTools`)
3. Implement screenshot tool using `react-native-view-shot`
4. Implement file explorer tool scoped to app sandbox storage
5. Panel navigation: support push/pop between root panel and tool sub-pages
   (matches the `←` back-arrow pattern observed in screenshots)

### Phase E — Custom device JSON support (§3.8)
1. `registerCustomDevice(preset: DevicePreset)` exported function
2. In-panel "New device from JSON…" form screen with validation + error display
3. Persist custom devices alongside settings

### Phase F — Native modules (§5 rows 2, 8, 11 — do last, highest cost/benefit ratio)
1. **Android (Kotlin)**: `DisplayMetrics` override module, `Configuration.fontScale`
   override module, color-inversion native `View` wrapper
2. **iOS (Swift)**: `UIScreen` bounds override module, `UIContentSizeCategory`
   override module, color-inversion native `View` wrapper
3. Wire both through a shared JS-facing native module interface so call sites don't
   branch on platform
4. **Scope check before starting**: confirm this is actually needed for the
   project's real use case (testing your own app's layout/accessibility) before
   investing here — see §5 row 22/23 for what native modules can and cannot fix

---

## 7. Explicit non-goals (tell Cursor to stop scope creep here)

- **Do not** attempt to make Android rendering visually identical to iOS or vice
  versa. This is a rendering-engine-level guarantee (Skia) that RN structurally
  cannot provide (§5 row 22). Any task attempting this should be rejected/flagged.
- **Do not** attempt to override native third-party SDK behavior (camera, maps,
  native date/time pickers) to respect simulated device settings — not achievable
  (§5 row 23).
- **Do not** try to fake true OS-level accessibility services (VoiceOver/TalkBack
  actually activating) — only simulate the **flag state** your own app's components
  can read and adapt to.

---

## 8. Reference screenshots inventory (for Cursor's context, not literal assets)

The seven screenshots this spec was derived from show the *Flutter reference
package's* control panel running against a Firebase-hosted demo app (a "Basic"
tile-list screen), captured from within a mobile browser:

1. Custom device tab — Width/Height/Pixel ratio sliders, values 640 / 1024 / 2
2. macOS device tab — Desktop "Large" (1620x750 @2) and Laptop "MacBook Pro" entries
3. Bold text (Disabled) + Text scaling factor slider (value 1)
4. Locale ("English (Pakistan)"), Theme ("Light"), Accessible navigation
   (Disabled), Invert colors row
5. Preview enabled, bottom toggle bar with "Device Preview" label + switch, Android
   phone frame visible around the app content
6. iOS device tab — iPhone SE / 12 Mini / 13 Mini list with resolutions
7. Device/Orientation/Frame visibility/Virtual keyboard preview settings — Model
   "Small" (Android icon + phone icon), Orientation "Portrait", Frame visibility
   "Visible", Virtual keyboard preview "Hidden"

Every UI element visible across these seven screenshots is accounted for in §3
above — nothing observed was left out of the feature inventory.
