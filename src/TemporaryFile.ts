/**
 * Represents a temporary file in the local filesystem.
 */
export type TemporaryFile = Readonly<{
  /**
   * The path of the file. This file might get deleted once the app closes because it lives in the temp directory.
   */
  path: string;
}>;
