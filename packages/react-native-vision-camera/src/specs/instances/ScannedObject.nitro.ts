import type { HybridObject } from 'react-native-nitro-modules'
import type { Point } from '../common-types/Point'

import type { PreviewView } from '../views/PreviewView.nitro'

/**
 * Represents the bounding box around a {@linkcode ScannedObject}, in
 * camera-space coordinates (`0.0` ... `1.0`).
 *
 * Convert to view-space using
 * {@linkcode PreviewView.convertCameraPointToViewPoint | PreviewView.convertCameraPointToViewPoint(...)}.
 */
export interface BoundingBox {
  /**
   * The minimum X coordinate.
   */
  x: number
  /**
   * The minimum Y coordinate.
   */
  y: number
  /**
   * The width of the bounding box.
   */
  width: number
  /**
   * The height of the bounding box.
   */
  height: number
}

/**
 * Represents the type of a {@linkcode ScannedObject}.
 */
export type ScannedObjectType =
  | 'codabar'
  | 'code-39'
  | 'code-39-mod-43'
  | 'code-93'
  | 'code-128'
  | 'ean-8'
  | 'ean-13'
  | 'gs1-data-bar'
  | 'gs1-data-bar-expanded'
  | 'gs1-data-bar-limited'
  | 'interleaved-2-of-5'
  | 'itf-14'
  | 'upc-e'
  | 'aztec'
  | 'data-matrix'
  | 'micro-pdf-417'
  | 'micro-qr'
  | 'pdf-417'
  | 'qr'
  | 'human-body'
  | 'human-full-body'
  | 'dog-head'
  | 'dog-body'
  | 'cat-head'
  | 'cat-body'
  | 'face'
  | 'salient-object'
  | 'unknown'

/**
 * Represents any kind of scanned object.
 * @see {@linkcode ScannedCode}
 * @see {@linkcode ScannedFace}
 * @platform iOS
 */
export interface ScannedObject
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * The {@linkcode ScannedObjectType} of this {@linkcode ScannedObject}.
   */
  readonly type: ScannedObjectType
  /**
   * The bounding box coordinates of this {@linkcode ScannedObject}.
   *
   * Coordinates are in camera-space (`0.0` ... `1.0`), and can be
   * converted to view-space via the {@linkcode PreviewView}.
   */
  readonly boundingBox: BoundingBox
}

/**
 * Represents a machine-readable code, such as a QR code.
 * @platform iOS
 */
export interface ScannedCode extends ScannedObject {
  /**
   * The decoded string value of this {@linkcode ScannedCode}, or `undefined`
   * if the value cannot be decoded.
   * This is error-corrected.
   */
  readonly value?: string
  /**
   * The corner points outlining this {@linkcode ScannedCode}.
   *
   * Coordinates are in camera-space (`0.0` ... `1.0`), and can be
   * converted to view-space via the {@linkcode PreviewView}.
   */
  readonly cornerPoints: Point[]
}

/**
 * Represents a Face.
 * @platform iOS
 */
export interface ScannedFace extends ScannedObject {
  /**
   * The ID of this {@linkcode ScannedFace} used to
   * identify multiple faces in the same scene.
   */
  readonly faceID: number
  /**
   * A Boolean value indicating whether there is a valid roll angle associated with the face.
   */
  readonly hasRollAngle: boolean
  /**
   * The roll angle of the face specified in degrees.
   */
  readonly rollAngle: number
  /**
   * A Boolean value indicating whether there is a valid yaw angle associated with the face.
   */
  readonly hasYawAngle: boolean
  /**
   * The yaw angle of the face specified in degrees.
   */
  readonly yawAngle: number
}
