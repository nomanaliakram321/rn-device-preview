import { Keyboard } from 'react-native';
import { keyboardBridge } from '../keyboard/keyboardBridge';
import { updatePreviewSnapshot } from '../keyboard/previewSnapshot';
import { SIMULATED_KEYBOARD_HEIGHT } from '../keyboard/constants';

describe('keyboardBridge integration with the real react-native Keyboard module', () => {
  afterEach(() => {
    keyboardBridge.uninstall();
    updatePreviewSnapshot({
      enabled: false,
      virtualKeyboardVisible: false,
      scale: 1,
      deviceWidth: 0,
      deviceHeight: 0,
    });
  });

  it('redirects a real Keyboard.addListener("keyboardDidShow", ...) subscriber through the bridge', () => {
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener');

    keyboardBridge.install();
    // The bridge's own internal subscriptions happen inside install(); the
    // spy has now recorded them. Grab the real captured native callback
    // for 'keyboardDidShow' so we can simulate a real host keyboard event
    // firing, exactly as RN's native side would invoke it.
    const internalShowCall = addListenerSpy.mock.calls.find(([name]) => name === 'keyboardDidShow');
    expect(internalShowCall).toBeDefined();
    const nativeCallback = internalShowCall![1] as (event: any) => void;

    updatePreviewSnapshot({ enabled: true, virtualKeyboardVisible: false, scale: 0.5, deviceWidth: 375 });

    // A consumer — standing in for RN's own KeyboardAvoidingView — registers
    // through the now-bridged Keyboard.addListener.
    const consumer = jest.fn();
    Keyboard.addListener('keyboardDidShow', consumer);

    // Simulate the real host keyboard opening at 400 host px.
    nativeCallback({ endCoordinates: { height: 400 } });

    expect(consumer).toHaveBeenCalledWith(
      expect.objectContaining({ endCoordinates: expect.objectContaining({ height: 800 }) })
    );

    addListenerSpy.mockRestore();
  });

  it('does not double-apply when both the real and simulated keyboards are active', () => {
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener');
    keyboardBridge.install();
    const internalShowCall = addListenerSpy.mock.calls.find(([name]) => name === 'keyboardDidShow');
    const nativeCallback = internalShowCall![1] as (event: any) => void;

    updatePreviewSnapshot({ enabled: true, virtualKeyboardVisible: true, scale: 0.5, deviceWidth: 375 });

    const consumer = jest.fn();
    Keyboard.addListener('keyboardDidShow', consumer);
    nativeCallback({ endCoordinates: { height: 400 } }); // scaled = 800, simulated = 291

    const lastHeight =
      consumer.mock.calls[consumer.mock.calls.length - 1][0].endCoordinates.height;
    expect(lastHeight).toBe(800);
    expect(lastHeight).not.toBe(800 + SIMULATED_KEYBOARD_HEIGHT);

    addListenerSpy.mockRestore();
  });

  it('restores real Keyboard.addListener behavior after uninstall — no lingering interception', () => {
    const originalAddListener = Keyboard.addListener;
    keyboardBridge.install();
    expect(Keyboard.addListener).not.toBe(originalAddListener);
    keyboardBridge.uninstall();
    expect(Keyboard.addListener).toBe(originalAddListener);
  });

  // Finding 2 + 3: RN's real KeyboardAvoidingView subscribes to
  // 'keyboardWillChangeFrame' exclusively on iOS (see
  // node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js
  // componentDidMount) — not keyboardWillShow/keyboardDidShow. This test
  // stands a consumer in for that real component, registering through the
  // same channel it actually uses, against RN's real Keyboard singleton
  // (not the fake module used in keyboardBridge.test.ts), and confirms both
  // that the event reaches it at all (Finding 2) and that screenY is
  // deviceHeight - height rather than a hardcoded 0 (Finding 3).
  it('redirects a real Keyboard.addListener("keyboardWillChangeFrame", ...) subscriber — the exact channel iOS KeyboardAvoidingView uses — through the bridge, with correct screenY', () => {
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener');

    keyboardBridge.install();
    const internalShowCall = addListenerSpy.mock.calls.find(([name]) => name === 'keyboardDidShow');
    expect(internalShowCall).toBeDefined();
    const nativeCallback = internalShowCall![1] as (event: any) => void;

    updatePreviewSnapshot({
      enabled: true,
      virtualKeyboardVisible: false,
      scale: 0.5,
      deviceWidth: 375,
      deviceHeight: 812,
    });

    const consumer = jest.fn();
    Keyboard.addListener('keyboardWillChangeFrame', consumer);

    // Simulate the real host keyboard opening at 400 host px.
    nativeCallback({ endCoordinates: { height: 400 } });

    expect(consumer).toHaveBeenCalledWith(
      expect.objectContaining({
        endCoordinates: expect.objectContaining({ height: 800, screenY: 812 - 800 }),
      })
    );

    addListenerSpy.mockRestore();
  });
});
