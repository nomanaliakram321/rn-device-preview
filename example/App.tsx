import React from 'react';
import { DevicePreview } from 'rn-device-preview';
import SocialFeedScreen from './SocialFeedScreen';

// This is your real app root — untouched by the preview logic itself.
export default function App() {
  return (
    <DevicePreview enabled={__DEV__}>
      <SocialFeedScreen />
    </DevicePreview>
  );
}
