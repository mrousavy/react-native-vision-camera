import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import type { Frame } from '../Frame';

declare global {
  interface TensorflowModel {
    run(frame: Frame): ArrayBuffer[];
  }

  /**
   * Loads the Model into memory. Path is fetchable resource, e.g.:
   * http://192.168.8.110:8081/assets/assets/model.tflite?platform=ios&hash=32e9958c83e5db7d0d693633a9f0b175
   */
  const loadTensorflowModel: (path: string, delegate?: 'metal' | 'core-ml') => TensorflowModel;
}

type Require = ReturnType<typeof require>;

export type TensorflowPlugin =
  | {
      model: TensorflowModel;
      state: 'loaded';
    }
  | {
      model: undefined;
      state: 'loading';
    }
  | {
      model: undefined;
      error: Error;
      state: 'error';
    };

export function useTensorflowModel(path: Require): TensorflowPlugin {
  const [state, setState] = useState<TensorflowPlugin>({ model: undefined, state: 'loading' });

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setState({ model: undefined, state: 'loading' });
        console.log(`Loading new Model: ${path}`);
        const source = Image.resolveAssetSource(path);
        console.log(`Resolved Model path: ${source.uri}`);
        // TODO: Make this async and await this then.
        const m = loadTensorflowModel(source.uri);
        setState({ model: m, state: 'loaded' });
        console.log('Model loaded!');
      } catch (e) {
        console.error(`Failed to load Tensorflow Model ${path}!`, e);
        setState({ model: undefined, state: 'error', error: e as Error });
      }
    };
    load();
  }, [path]);

  return state;
}
