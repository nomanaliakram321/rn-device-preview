import { useDevicePreview } from '../context/DevicePreviewContext';

/**
 * Returns the simulated locale (e.g. "en-US", "ur-PK") when preview is
 * active. Feed this into your i18n library's active-locale setting
 * (i18next: i18n.changeLanguage(locale), react-intl: <IntlProvider locale>).
 * This only affects your app's own string/date/number formatting —
 * it cannot override native OS-level locale for native components.
 */
export function useSimulatedLocale(realLocale: string): string {
  const preview = useDevicePreview();
  if (!preview || !preview.enabled) return realLocale;
  return preview.locale;
}
