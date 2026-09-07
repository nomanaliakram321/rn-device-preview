import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SIMULATED_KEYBOARD_HEIGHT } from '../keyboard/constants';

const ROW_KEY_COUNTS = [10, 9, 7];

/**
 * Purely decorative fake keyboard, drawn at the bottom of the simulated
 * viewport when `virtualKeyboardVisible` is on. It never intercepts touches
 * (`pointerEvents="none"`) — its only job is to visually reserve the space
 * that `useSimulatedKeyboardHeight()`/the keyboard bridge already account
 * for in layout.
 */
export function SimulatedKeyboard() {
  return (
    <View style={styles.container} pointerEvents="none" testID="simulated-keyboard">
      {ROW_KEY_COUNTS.map((keyCount, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {Array.from({ length: keyCount }).map((_, keyIndex) => (
            <View key={keyIndex} style={styles.key} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SIMULATED_KEYBOARD_HEIGHT,
    backgroundColor: '#d1d3d9',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  key: {
    width: 24,
    height: 36,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
