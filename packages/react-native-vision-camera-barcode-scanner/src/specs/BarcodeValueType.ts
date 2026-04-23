/**
 * Represents the semantic type of data encoded in a {@linkcode Barcode}.
 *
 * This describes **what** the barcode's content represents (e.g. a URL, a
 * phone number, a WiFi config), not the barcode's visual format (see
 * {@linkcode BarcodeFormat}).
 *
 * `'unknown'` is used when the content type could not be classified.
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
