/**
 * Represents a temporary file in the local filesystem.
 */
export interface TemporaryFile {
  /**
   * The path of the file.
   *
   * * **Note:** If you want to consume this file (e.g. for displaying it in an `<Image>` component), you might have to add the `file://` prefix.
   *
   * * **Note:** This file might get deleted once the app closes because it lives in the temp directory.
   */
  path: string
}
