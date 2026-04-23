/**
 * Represents the semantic type of data encoded in a {@linkcode Barcode} - e.g.
 * a URL, a phone number, or a WiFi config - or `'unknown'` if the content type
 * could not be classified.
 *
 * This describes **what** the barcode's content represents, not the barcode's
 * visual format (see {@linkcode BarcodeFormat}).
 */
export type BarcodeValueType =
  | 'unknown'
  | 'contact-info'
  | 'email'
  | 'isbn'
  | 'phone'
  | 'product'
  | 'sms'
  | 'text'
  | 'url'
  | 'wifi'
  | 'geo'
  | 'calendar-event'
  | 'driver-license'
