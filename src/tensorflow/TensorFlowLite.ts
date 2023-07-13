import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import type { Frame } from '../Frame';

export type TensorflowModelDelegate = 'default' | 'metal' | 'core-ml';

interface Tensor {
  /**
   * The name of the Tensor.
   */
  name: string;
  /**
   * The data-type all values of this Tensor are represented in.
   */
  dataType: 'bool' | 'uint8' | 'int8' | 'int16' | 'int32' | 'int64' | 'float16' | 'float32' | 'float64' | 'invalid';
  /**
   * The shape of the data from this tensor.
   */
  shape: number[];
}

export interface TensorflowModel {
  /**
   * The computation delegate used by this Model.
   * While CoreML and Metal delegates might be faster as they use the GPU, not all models support those delegates.
   */
  delegate: TensorflowModelDelegate;
  /**
   * Run the Tensorflow Model with the given Camera Frame.
   * The Frame will automatically be resized, cropped and re-sampled to match the input tensor's size.
   */
  run(frame: Frame): Uint8Array[];

  /**
   * All input tensors of this Tensorflow Model.
   * VisionCamera expects only one input tensor for inputting the Camera Frame.
   * The most efficient format for the input tensor is RGB in uint8 types.
   */
  inputs: Tensor[];
  /**
   * All output tensors of this Tensorflow Model.
   * The user is responsible for correctly interpreting this data.
   */
  outputs: Tensor[];
}

declare global {
  /**
   * Loads the Model into memory. Path is fetchable resource, e.g.:
   * http://192.168.8.110:8081/assets/assets/model.tflite?platform=ios&hash=32e9958c83e5db7d0d693633a9f0b175
   */
  const __loadTensorflowModel: (path: string, delegate: TensorflowModelDelegate) => Promise<TensorflowModel>;
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

/**
 * Load a Tensorflow Lite Model from the given `.tflite` asset.
 * @param path The `.tflite` model in form of a `require(..)` statement. Make sure to add `tflite` as an asset extension to `metro.config.js`!
 * @param delegate The delegate to use for computations. Uses the standard CPU delegate per default. The `core-ml` or `metal` delegates are GPU-accelerated, but don't work on every model.
 * @returns The loaded Model.
 */
export function loadTensorflowModel(path: Require, delegate: TensorflowModelDelegate = 'default'): Promise<TensorflowModel> {
  console.log(`Loading Tensorflow Lite Model ${path}`);
  const source = Image.resolveAssetSource(path);
  console.log(`Resolved Model path: ${source.uri}`);
  return __loadTensorflowModel(source.uri, delegate);
}

/**
 * Load a Tensorflow Lite Model from the given `.tflite` asset into a React State.
 * @param path The `.tflite` model in form of a `require(..)` statement. Make sure to add `tflite` as an asset extension to `metro.config.js`!
 * @param delegate The delegate to use for computations. Uses the standard CPU delegate per default. The `core-ml` or `metal` delegates are GPU-accelerated, but don't work on every model.
 * @returns The state of the Model.
 */
export function useTensorflowModel(path: Require, delegate: TensorflowModelDelegate = 'default'): TensorflowPlugin {
  const [state, setState] = useState<TensorflowPlugin>({ model: undefined, state: 'loading' });

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setState({ model: undefined, state: 'loading' });
        const m = await loadTensorflowModel(path, delegate);
        setState({ model: m, state: 'loaded' });
        console.log('Model loaded!');
      } catch (e) {
        console.error(`Failed to load Tensorflow Model ${path}!`, e);
        setState({ model: undefined, state: 'error', error: e as Error });
      }
    };
    load();
  }, [delegate, path]);

  return state;
}
