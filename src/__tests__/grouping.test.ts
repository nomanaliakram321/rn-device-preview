import { groupByFormFactor } from '../devices/grouping';
import { DevicePreset } from '../devices/types';

const insets = { top: 0, bottom: 0, left: 0, right: 0 };

function makePreset(id: string, formFactor: DevicePreset['formFactor']): DevicePreset {
  return {
    id,
    name: id,
    platform: 'ios',
    formFactor,
    width: 100,
    height: 100,
    pixelRatio: 2,
    insets,
    notch: 'none',
    homeIndicator: 'none',
  };
}

describe('groupByFormFactor', () => {
  it('groups presets by formFactor, preserving input order within each group', () => {
    const presets = [
      makePreset('a', 'phone'),
      makePreset('b', 'tablet'),
      makePreset('c', 'phone'),
    ];
    const grouped = groupByFormFactor(presets);
    expect(grouped.phone?.map((p) => p.id)).toEqual(['a', 'c']);
    expect(grouped.tablet?.map((p) => p.id)).toEqual(['b']);
  });

  it('returns an empty object for an empty input', () => {
    expect(groupByFormFactor([])).toEqual({});
  });
});
