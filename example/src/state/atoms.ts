import { atom } from 'pipestate';

interface FormatSettings {
  fps: unknown;
}

export const FormatSettingsAtom = atom<FormatSettings>({
  default: {
    fps: 60,
  },
});
