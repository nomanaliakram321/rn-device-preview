import { Keyboard as RNKeyboard } from 'react-native';
import { SIMULATED_KEYBOARD_HEIGHT } from './constants';
import { previewSnapshot, subscribeToPreviewSnapshot } from './previewSnapshot';

export type KeyboardEventCallback = (event: any) => void;
export type KeyboardSubscription = { remove: () => void };

export interface MinimalKeyboardModule {
  addListener: (eventName: string, callback: KeyboardEventCallback) => KeyboardSubscription;
}

export interface Bridge {
  install: () => void;
  uninstall: () => void;
  isInstalled: () => boolean;
}

const SHOW_EVENTS = ['keyboardWillShow', 'keyboardDidShow'] as const;
const HIDE_EVENTS = ['keyboardWillHide', 'keyboardDidHide'] as const;
// RN's own `KeyboardAvoidingView` (see
// `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js`,
// `componentDidMount`) does NOT subscribe to keyboardWillShow/keyboardDidShow
// on iOS — it subscribes to `keyboardWillChangeFrame` exclusively, using a
// single combined channel for both show and hide transitions (a hide is just
// a ChangeFrame event whose frame collapses). On Android it uses
// keyboardDidShow/keyboardDidHide instead, which the SHOW_EVENTS/HIDE_EVENTS
// groups above already cover. Without also bridging these two ChangeFrame
// event names, iOS's KeyboardAvoidingView would fall straight through to the
// REAL native event and never see the simulated/scaled keyboard — defeating
// the whole point of Phase C on iOS. `keyboardWillChangeFrame` and
// `keyboardDidChangeFrame` carry the same `endCoordinates: KeyboardMetrics`
// shape as show/hide events (confirmed in RN's `Keyboard.d.ts`), so they can
// be routed through the exact same `recompute()`/synthetic-event mechanism.
const CHANGE_FRAME_EVENTS = ['keyboardWillChangeFrame', 'keyboardDidChangeFrame'] as const;
const BRIDGED_EVENTS = new Set<string>([...SHOW_EVENTS, ...HIDE_EVENTS, ...CHANGE_FRAME_EVENTS]);

// Known, deliberately out-of-scope limitation: Reanimated's
// `useAnimatedKeyboard()` reads keyboard geometry via a native UI-thread
// binding, not through `Keyboard.addListener` — a JS-level monkey-patch like
// this bridge cannot intercept it. Simulating/scaling the keyboard for
// `useAnimatedKeyboard()` consumers would require a native module change,
// which is out of scope for this bridge.

/**
 * Intercepts `keyboardModule.addListener` so that ANY caller — including
 * React Native's own internal KeyboardAvoidingView — receives a synthetic
 * event reflecting max(real keyboard height mapped into simulated
 * coordinate space, simulated keyboard height) instead of the raw host
 * event. This is a monkey-patch of a plain mutable JS object method, not a
 * native binding — no native module required.
 */
export function createKeyboardBridge(
  // RN's own `Keyboard.addListener` typing (`KeyboardStatic` in
  // `Keyboard.d.ts`) narrows `eventType` to the six known `KeyboardEventName`
  // literals. `MinimalKeyboardModule` deliberately types `eventName` as a
  // plain `string` instead, because `bridgedAddListener` below must pass
  // through ANY event name a caller registers for — not just the four
  // bridged show/hide events — via `originalAddListener!(eventName,
  // callback)`. At runtime RN's real `Keyboard.addListener` is just
  // `this._emitter.addListener(eventType, listener)`, a generic
  // EventEmitter call with no validation of the event name, so it happily
  // accepts any string; `KeyboardEventName` is purely a TS-level annotation
  // RN puts on its own export, not a runtime constraint. The cast below
  // exists only to bridge that structural mismatch between RN's narrower
  // declared type and our intentionally wider duck-typed interface — it
  // does not change any runtime behavior.
  keyboardModule: MinimalKeyboardModule = RNKeyboard as unknown as MinimalKeyboardModule
): Bridge {
  let installed = false;
  let originalAddListenerRaw: MinimalKeyboardModule['addListener'] | null = null;
  let originalAddListener: MinimalKeyboardModule['addListener'] | null = null;
  let realKeyboardHeight = 0;
  let lastEffectiveHeight = 0;
  let lastDeviceWidth = 0;
  let lastDeviceHeight = 0;
  const consumers = new Map<string, Set<KeyboardEventCallback>>();
  let unsubscribeSnapshot: (() => void) | null = null;
  let internalSubscriptions: KeyboardSubscription[] = [];

  function getConsumers(eventName: string): Set<KeyboardEventCallback> {
    let set = consumers.get(eventName);
    if (!set) {
      set = new Set();
      consumers.set(eventName, set);
    }
    return set;
  }

  function computeEffectiveHeight(): number {
    const scaledReal = previewSnapshot.scale > 0 ? realKeyboardHeight / previewSnapshot.scale : realKeyboardHeight;
    const simulated = previewSnapshot.virtualKeyboardVisible ? SIMULATED_KEYBOARD_HEIGHT : 0;
    return Math.max(scaledReal, simulated);
  }

  function makeShowEvent(height: number) {
    // `screenY` is the keyboard's top-edge y-position within the simulated
    // viewport, not an arbitrary field — RN's own `KeyboardAvoidingView`
    // (`_relativeKeyboardHeight` in `KeyboardAvoidingView.js`) derives the
    // height it applies from `frame.y + frame.height - keyboardFrame.screenY`
    // (for the default/'padding'/'position' behaviors; 'height' behavior
    // adds `state.bottom`), NOT directly from `endCoordinates.height`. For a
    // KeyboardAvoidingView spanning the full simulated device (`frame.y ===
    // 0`, `frame.height === previewSnapshot.deviceHeight`), that formula
    // resolves to `deviceHeight - screenY`. Setting `screenY` to a hardcoded
    // 0 made it resolve to `deviceHeight - 0 === deviceHeight` — i.e. "the
    // keyboard covers almost the entire simulated screen" — regardless of
    // the actual keyboard height. Solving `deviceHeight - screenY ===
    // height` for `screenY` gives exactly `deviceHeight - height`, which is
    // what's used below so RN's own formula recovers the correct effective
    // height.
    return {
      endCoordinates: {
        height,
        screenX: 0,
        screenY: previewSnapshot.deviceHeight - height,
        width: previewSnapshot.deviceWidth,
      },
    };
  }

  function recompute(): void {
    const effective = computeEffectiveHeight();
    // A show/changeFrame event's screenY and width are derived from
    // deviceWidth/deviceHeight too (see makeShowEvent below), so a rotation
    // or device-preset switch that changes those while the effective height
    // stays the same must still re-emit — otherwise consumers keep using a
    // stale screenY computed against the old device size.
    if (
      effective === lastEffectiveHeight &&
      previewSnapshot.deviceWidth === lastDeviceWidth &&
      previewSnapshot.deviceHeight === lastDeviceHeight
    ) {
      return;
    }
    lastEffectiveHeight = effective;
    lastDeviceWidth = previewSnapshot.deviceWidth;
    lastDeviceHeight = previewSnapshot.deviceHeight;

    if (effective > 0) {
      const event = makeShowEvent(effective);
      [...SHOW_EVENTS, ...CHANGE_FRAME_EVENTS].forEach((name) =>
        getConsumers(name).forEach((cb) => cb(event))
      );
    } else {
      [...HIDE_EVENTS, ...CHANGE_FRAME_EVENTS].forEach((name) =>
        getConsumers(name).forEach((cb) => cb({}))
      );
    }
  }

  function bridgedAddListener(eventName: string, callback: KeyboardEventCallback): KeyboardSubscription {
    if (!BRIDGED_EVENTS.has(eventName)) {
      return originalAddListener!(eventName, callback);
    }
    getConsumers(eventName).add(callback);
    // A callback that subscribes after the effective height already stabilized
    // (no further real/simulated state change afterward) would otherwise never
    // learn the current state, since recompute() only re-emits on a value
    // change. Deliver the current state to THIS callback synchronously and
    // immediately, mirroring what a real host keyboard event would have told
    // it had it been listening from the start. Only a show is actionable this
    // way — a late 'keyboardDidHide' subscriber that never saw a show has
    // nothing to be told, so it stays silent until an actual transition.
    // ChangeFrame subscribers (iOS's KeyboardAvoidingView) get the same
    // treatment since that channel plays the role of "show" for them too.
    if (
      (SHOW_EVENTS as readonly string[]).includes(eventName) ||
      (CHANGE_FRAME_EVENTS as readonly string[]).includes(eventName)
    ) {
      const current = computeEffectiveHeight();
      if (current > 0) {
        callback(makeShowEvent(current));
      }
    }
    return {
      remove: () => {
        getConsumers(eventName).delete(callback);
      },
    };
  }

  function install(): void {
    if (installed) return;
    installed = true;
    originalAddListenerRaw = keyboardModule.addListener;
    originalAddListener = originalAddListenerRaw.bind(keyboardModule);

    internalSubscriptions = [
      originalAddListener('keyboardDidShow', (event: any) => {
        realKeyboardHeight = event?.endCoordinates?.height ?? 0;
        recompute();
      }),
      originalAddListener('keyboardDidHide', () => {
        realKeyboardHeight = 0;
        recompute();
      }),
    ];

    unsubscribeSnapshot = subscribeToPreviewSnapshot(recompute);
    (keyboardModule as MinimalKeyboardModule).addListener = bridgedAddListener;

    // `consumers` deliberately survives across uninstall()/install() cycles
    // (see the comment on `consumers.clear()`'s removal in uninstall()) so a
    // component that stays mounted through a disable→enable toggle of the
    // whole preview keeps receiving events without needing to unmount and
    // re-subscribe. Resync those already-registered consumers to whatever
    // the current state is right now — real/simulated state may have
    // changed while uninstalled, and no event fires for that until the next
    // transition otherwise.
    recompute();
  }

  function uninstall(): void {
    if (!installed) return;
    installed = false;
    // Only restore the module's addListener to our cached "original" if the
    // module still has OUR patch installed. Something outside the bridge
    // (e.g. a test's own jest.spyOn(...).mockRestore() firing between
    // install() and uninstall(), which is exactly what happens when a spy is
    // set up before install() and torn down before the matching uninstall())
    // can legitimately change keyboardModule.addListener out from under us
    // while installed stays true. Blindly overwriting in that case would
    // clobber whatever that external party already (correctly) put back
    // with our now-stale cached reference — which, if that external party
    // was a jest mock that has since been mockRestore()'d, is a dead mock
    // that no longer calls through to anything and returns undefined.
    if (originalAddListenerRaw && (keyboardModule as MinimalKeyboardModule).addListener === bridgedAddListener) {
      (keyboardModule as MinimalKeyboardModule).addListener = originalAddListenerRaw;
    }
    internalSubscriptions.forEach((sub) => sub?.remove());
    internalSubscriptions = [];
    unsubscribeSnapshot?.();
    unsubscribeSnapshot = null;
    // Deliberately NOT clearing `consumers` here: a component that stays
    // mounted across an uninstall()/install() cycle (e.g. the preview's
    // master switch toggled off then on) registered its callback via
    // bridgedAddListener once at mount and won't call addListener again
    // without unmounting/remounting. Clearing the Set would silently and
    // permanently drop that listener for the rest of the component's
    // lifetime. install() calls recompute() to resync survivors instead.
    realKeyboardHeight = 0;
    lastEffectiveHeight = 0;
    lastDeviceWidth = 0;
    lastDeviceHeight = 0;
    originalAddListenerRaw = null;
    originalAddListener = null;
  }

  return { install, uninstall, isInstalled: () => installed };
}

export const keyboardBridge = createKeyboardBridge();
