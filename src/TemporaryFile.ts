/**
 * Represents a temporary file in the local filesystem.
 */
export interface TemporaryFile {
  /**
   * The path of the file. This file might get deleted once the app closes because it lives in the temp directory.
   */
  path: string;
}
