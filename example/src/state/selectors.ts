import { selector } from 'pipestate';
import { FormatSettingsAtom } from './atoms';

export const FpsSelector = selector({
  get: ({ get }) => {
    return get(FormatSettingsAtom).fps;
  },
  set: ({ set, get }, newFps) => {
    const formatSettings = get(FormatSettingsAtom);
    set(FormatSettingsAtom, { ...formatSettings, fps: newFps });
  },
  dependencies: [FormatSettingsAtom],
});
