import { atom } from 'pipestate';

interface FormatSettings {
  fps: number;
}

export const FormatSettingsAtom = atom<FormatSettings>({
  default: {
    fps: 50,
  },
});
