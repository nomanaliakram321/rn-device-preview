import React from 'react';
import { render } from '@testing-library/react-native';
import { SimulatedKeyboard } from '../components/SimulatedKeyboard';

describe('SimulatedKeyboard', () => {
  it('renders with the simulated-keyboard testID', () => {
    const { getByTestId } = render(<SimulatedKeyboard />);
    expect(getByTestId('simulated-keyboard')).toBeTruthy();
  });
});
