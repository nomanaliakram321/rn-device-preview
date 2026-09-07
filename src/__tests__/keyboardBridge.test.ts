import { createKeyboardBridge, MinimalKeyboardModule } from '../keyboard/keyboardBridge';
import { updatePreviewSnapshot } from '../keyboard/previewSnapshot';
import { SIMULATED_KEYBOARD_HEIGHT } from '../keyboard/constants';

function makeFakeKeyboardModule() {
  const registry = new Map<string, Set<(event: any) => void>>();
  const addListenerCalls: string[] = [];

  const module: MinimalKeyboardModule = {
    addListener: jest.fn((eventName: string, callback: (event: any) => void) => {
      addListenerCalls.push(eventName);
      let set = registry.get(eventName);
      if (!set) {
        set = new Set();
        registry.set(eventName, set);
      }
      set.add(callback);
      return {
        remove: () => {
          registry.get(eventName)?.delete(callback);
        },
      };
    }),
  };

  return {
    module,
    addListenerCalls,
    emit(eventName: string, event: any) {
      registry.get(eventName)?.forEach((cb) => cb(event));
    },
  };
}

describe('keyboardBridge', () => {
  afterEach(() => {
    updatePreviewSnapshot({
      enabled: false,
      virtualKeyboardVisible: false,
      scale: 1,
      deviceWidth: 0,
      deviceHeight: 0,
    });
  });

  it('passes non-keyboard-show/hide events straight through, both before and after install', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    const consumer = jest.fn();

    fake.module.addListener('keyboardDidChangeFrame', consumer);
    bridge.install();
    fake.module.addListener('keyboardDidChangeFrame', consumer);
    fake.emit('keyboardDidChangeFrame', { screenX: 1 });

    expect(consumer).toHaveBeenCalledWith({ screenX: 1 });
    bridge.uninstall();
  });

  it('install() subscribes internally to keyboardDidShow/keyboardDidHide exactly once', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    expect(fake.addListenerCalls.filter((n) => n === 'keyboardDidShow')).toHaveLength(1);
    expect(fake.addListenerCalls.filter((n) => n === 'keyboardDidHide')).toHaveLength(1);
    bridge.uninstall();
  });

  it('emits the simulated height to a bridged consumer when only the simulated keyboard is on', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({ enabled: true, virtualKeyboardVisible: true, scale: 1, deviceWidth: 375 });

    const consumer = jest.fn();
    fake.module.addListener('keyboardDidShow', consumer);
    updatePreviewSnapshot({ virtualKeyboardVisible: true }); // no-op change to force a recompute tick if needed

    expect(consumer).toHaveBeenCalledWith(
      expect.objectContaining({ endCoordinates: expect.objectContaining({ height: SIMULATED_KEYBOARD_HEIGHT }) })
    );
    bridge.uninstall();
  });

  it('scales a real keyboard event into simulated coordinate space', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({ enabled: true, virtualKeyboardVisible: false, scale: 0.5, deviceWidth: 375 });

    const consumer = jest.fn();
    fake.module.addListener('keyboardDidShow', consumer);
    fake.emit('keyboardDidShow', { endCoordinates: { height: 400 } });

    expect(consumer).toHaveBeenCalledWith(
      expect.objectContaining({ endCoordinates: expect.objectContaining({ height: 800 }) })
    );
    bridge.uninstall();
  });

  it('never sums real + simulated height — the larger one wins', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({ enabled: true, virtualKeyboardVisible: true, scale: 0.5, deviceWidth: 375 });

    const consumer = jest.fn();
    fake.module.addListener('keyboardDidShow', consumer);
    fake.emit('keyboardDidShow', { endCoordinates: { height: 400 } }); // scaled = 800, simulated = 291

    const lastCall = consumer.mock.calls[consumer.mock.calls.length - 1][0];
    expect(lastCall.endCoordinates.height).toBe(800);
    expect(lastCall.endCoordinates.height).not.toBe(800 + SIMULATED_KEYBOARD_HEIGHT);
    bridge.uninstall();
  });

  it('emits a hide event to bridged consumers once both real and simulated heights drop to 0', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({ enabled: true, virtualKeyboardVisible: true, scale: 1, deviceWidth: 375 });

    const showConsumer = jest.fn();
    const hideConsumer = jest.fn();
    fake.module.addListener('keyboardDidShow', showConsumer);
    fake.module.addListener('keyboardDidHide', hideConsumer);

    updatePreviewSnapshot({ virtualKeyboardVisible: false });
    expect(hideConsumer).toHaveBeenCalled();
    bridge.uninstall();
  });

  it('uninstall() restores the module to its pre-install addListener and stops bridging', () => {
    const fake = makeFakeKeyboardModule();
    const originalAddListener = fake.module.addListener;
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    expect(fake.module.addListener).not.toBe(originalAddListener);
    bridge.uninstall();
    expect(fake.module.addListener).toBe(originalAddListener);
    expect(bridge.isInstalled()).toBe(false);
  });

  it('install() is idempotent — calling it twice does not double-subscribe', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    bridge.install();
    expect(fake.addListenerCalls.filter((n) => n === 'keyboardDidShow')).toHaveLength(1);
    bridge.uninstall();
  });

  it('delivers the current effective height synchronously to a consumer that subscribes after the height already stabilized', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({ enabled: true, virtualKeyboardVisible: true, scale: 1, deviceWidth: 375 });

    // No further real/simulated state change happens after this point — the
    // consumer subscribes into an already-stable, already-shown state.
    const lateConsumer = jest.fn();
    fake.module.addListener('keyboardDidShow', lateConsumer);

    expect(lateConsumer).toHaveBeenCalledWith(
      expect.objectContaining({ endCoordinates: expect.objectContaining({ height: SIMULATED_KEYBOARD_HEIGHT }) })
    );
    bridge.uninstall();
  });

  // --- Finding 2: keyboardWillChangeFrame / keyboardDidChangeFrame bridging ---
  // RN's own KeyboardAvoidingView subscribes to 'keyboardWillChangeFrame'
  // exclusively on iOS (not keyboardWillShow/keyboardDidShow) — see
  // node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js.
  // These two events must be bridged the same way show events are, or iOS's
  // KeyboardAvoidingView never sees the simulated/scaled keyboard.
  it('bridges keyboardWillChangeFrame and keyboardDidChangeFrame the same way show events are bridged', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({
      enabled: true,
      virtualKeyboardVisible: true,
      scale: 1,
      deviceWidth: 375,
      deviceHeight: 812,
    });

    // Registering AFTER the effective height already stabilized exercises
    // the same synchronous late-subscriber delivery path SHOW_EVENTS get —
    // proving these two event names are treated as first-class bridged
    // consumers, not left to fall through to originalAddListener.
    const willConsumer = jest.fn();
    const didConsumer = jest.fn();
    fake.module.addListener('keyboardWillChangeFrame', willConsumer);
    fake.module.addListener('keyboardDidChangeFrame', didConsumer);

    expect(willConsumer).toHaveBeenCalledWith(
      expect.objectContaining({ endCoordinates: expect.objectContaining({ height: SIMULATED_KEYBOARD_HEIGHT }) })
    );
    expect(didConsumer).toHaveBeenCalledWith(
      expect.objectContaining({ endCoordinates: expect.objectContaining({ height: SIMULATED_KEYBOARD_HEIGHT }) })
    );
    // Bridged events are intercepted, not passed through to the underlying
    // module's real addListener — so the fake's own call log should show no
    // passthrough registration for either name.
    expect(fake.addListenerCalls).not.toContain('keyboardWillChangeFrame');
    expect(fake.addListenerCalls).not.toContain('keyboardDidChangeFrame');
    bridge.uninstall();
  });

  it('emits a hide ({}) event to keyboardWillChangeFrame/keyboardDidChangeFrame consumers once the effective height drops to 0', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({
      enabled: true,
      virtualKeyboardVisible: true,
      scale: 1,
      deviceWidth: 375,
      deviceHeight: 812,
    });

    const changeFrameConsumer = jest.fn();
    fake.module.addListener('keyboardWillChangeFrame', changeFrameConsumer);

    updatePreviewSnapshot({ virtualKeyboardVisible: false });
    expect(changeFrameConsumer).toHaveBeenLastCalledWith({});
    bridge.uninstall();
  });

  // --- Finding 3: screenY must be deviceHeight - height, not a hardcoded 0 ---
  // RN's KeyboardAvoidingView derives the height it applies from
  // `frame.y + frame.height - keyboardFrame.screenY`, not directly from
  // `endCoordinates.height`. For a view spanning the full simulated device
  // (frame.y === 0, frame.height === deviceHeight), that resolves to
  // `deviceHeight - screenY`, which must equal the effective height — so
  // screenY must be `deviceHeight - height`.
  it('computes screenY as deviceHeight - height for a scaled real keyboard event', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({
      enabled: true,
      virtualKeyboardVisible: false,
      scale: 0.5,
      deviceWidth: 375,
      deviceHeight: 812,
    });

    const consumer = jest.fn();
    fake.module.addListener('keyboardDidShow', consumer);
    fake.emit('keyboardDidShow', { endCoordinates: { height: 400 } }); // scaled = 800

    expect(consumer).toHaveBeenCalledWith(
      expect.objectContaining({
        endCoordinates: expect.objectContaining({ height: 800, screenY: 812 - 800 }),
      })
    );
    bridge.uninstall();
  });

  it('computes screenY as deviceHeight - height for the simulated-keyboard-only scenario', () => {
    const fake = makeFakeKeyboardModule();
    const bridge = createKeyboardBridge(fake.module);
    bridge.install();
    updatePreviewSnapshot({
      enabled: true,
      virtualKeyboardVisible: true,
      scale: 1,
      deviceWidth: 375,
      deviceHeight: 812,
    });

    const consumer = jest.fn();
    fake.module.addListener('keyboardDidShow', consumer);

    expect(consumer).toHaveBeenCalledWith(
      expect.objectContaining({
        endCoordinates: expect.objectContaining({
          height: SIMULATED_KEYBOARD_HEIGHT,
          screenY: 812 - SIMULATED_KEYBOARD_HEIGHT,
        }),
      })
    );
    bridge.uninstall();
  });
});
