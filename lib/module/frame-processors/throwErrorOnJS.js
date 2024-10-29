import { WorkletsProxy } from '../dependencies/WorkletsProxy';
import { FrameProcessorsUnavailableError } from './FrameProcessorsUnavailableError';
/**
 * Rethrows the given message and stack as a JS Error on the JS Thread.
 */
let rethrowErrorOnJS;
try {
  const Worklets = WorkletsProxy.Worklets;
  rethrowErrorOnJS = Worklets.createRunOnJS((message, stack) => {
    const error = new Error();
    error.message = message;
    error.stack = stack;
    error.name = 'Frame Processor Error';
    // @ts-expect-error this is react-native specific
    error.jsEngine = 'VisionCamera';

    // From react-native:
    // @ts-expect-error it's untyped
    const errorUtils = global.ErrorUtils ?? global.__ErrorUtils;
    if (errorUtils != null && typeof errorUtils.reportFatalError === 'function') {
      // we can use the JS error reporter view from react native
      errorUtils.reportFatalError(error);
    } else {
      // just log it to console.error as a fallback
      console.error('Frame Processor Error:', error);
    }
  });
} catch (e) {
  // react-native-worklets-core is not installed!
  // Just use dummy implementations that will throw when the user tries to use Frame Processors.
  rethrowErrorOnJS = () => {
    throw new FrameProcessorsUnavailableError(e);
  };
}

/**
 * Throws the given Error on the JS Thread using React Native's error reporter.
 * @param error An {@linkcode Error}, or an object with a `message` property, otherwise a default messageg will be thrown.
 */
export function throwErrorOnJS(error) {
  'worklet';

  const safeError = error;
  const message = safeError != null && 'message' in safeError ? safeError.message : 'Frame Processor threw an error.';
  rethrowErrorOnJS(message, safeError?.stack);
}
//# sourceMappingURL=throwErrorOnJS.js.map