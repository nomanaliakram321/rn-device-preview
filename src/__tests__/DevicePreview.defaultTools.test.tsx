import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { DevicePreview } from '../components/DevicePreview';

describe('DevicePreview default tools', () => {
  it('renders no TOOLS section without an explicit tools prop (no built-in tools)', () => {
    const { getByText, queryByText } = render(
      <DevicePreview enabled persist={false}>
        <Text>app content</Text>
      </DevicePreview>
    );
    fireEvent.press(getByText('Device Preview'));
    expect(queryByText('TOOLS')).toBeNull();
  });
});
