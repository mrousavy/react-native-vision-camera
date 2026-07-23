import { Image as RNImage } from 'react-native'
import { describe, expect, it } from 'react-native-harness'
import type { Image as NitroImage } from 'react-native-nitro-image'
import { loadImage } from 'react-native-nitro-image'
import type { CameraOrientation } from 'react-native-vision-camera'
import { HybridFrameConverter } from 'react-native-vision-camera'
import {
  type Barcode,
  createBarcodeScanner,
  type TargetBarcodeFormat,
} from 'react-native-vision-camera-barcode-scanner'
import { withTimeout } from './test-utils'

const qrCodeAsset = require('../src/assets/qr-code-margelo.png')
const code128Asset = require('../src/assets/code-128-mrousavy.png')

describe('VisionCamera - Barcode Scanner', () => {
  it('scans a QR code from a Nitro Image', async () => {
    const barcodes = await scanCodesInAssetImage(qrCodeAsset, ['qr-code'])

    expect(barcodes).toHaveLength(1)
    expect(barcodes[0]?.format).toBe('qr-code')
    expect(barcodes[0]?.rawValue).toBe('https://margelo.com')
  })

  it('scans a Code 128 barcode from a Nitro Image', async () => {
    const code128Barcodes = await scanCodesInAssetImage(code128Asset, [
      'code-128',
    ])

    expect(code128Barcodes).toHaveLength(1)
    expect(code128Barcodes[0]?.format).toBe('code-128')
    expect(code128Barcodes[0]?.rawValue).toBe('https://mrousavy.com')

    const allFormatBarcodes = await scanCodesInAssetImage(code128Asset, [
      'all-formats',
    ])

    expect(allFormatBarcodes).toHaveLength(1)
    expect(allFormatBarcodes[0]?.format).toBe('code-128')
    expect(allFormatBarcodes[0]?.rawValue).toBe('https://mrousavy.com')
  })

  // The Frame-based scanning path is what Frame Processors use - create
  // camera-like Frames from the bundled assets via the FrameConverter to
  // exercise it without a physical code in front of the camera.
  for (const orientation of [
    'up',
    'right',
    'down',
    'left',
  ] satisfies CameraOrientation[]) {
    it(`scans a QR code from a Frame in orientation=${orientation}`, async () => {
      const image = await loadNitroImageFromAsset(qrCodeAsset)
      try {
        const frame = HybridFrameConverter.convertImageToFrame(
          image,
          orientation,
          false,
        )
        const scanner = createBarcodeScanner({ barcodeFormats: ['qr-code'] })
        try {
          const barcodes = await withTimeout(
            scanner.scanCodesAsync(frame),
            15_000,
            `scan QR code from ${orientation} Frame`,
          )
          expect(barcodes).toHaveLength(1)
          expect(barcodes[0]?.format).toBe('qr-code')
          expect(barcodes[0]?.rawValue).toBe('https://margelo.com')
        } finally {
          scanner.dispose()
          frame.dispose()
        }
      } finally {
        image.dispose()
      }
    })
  }

  it('scans a QR code synchronously from a Frame', async () => {
    const image = await loadNitroImageFromAsset(qrCodeAsset)
    try {
      const frame = HybridFrameConverter.convertImageToFrame(image, 'up', false)
      const scanner = createBarcodeScanner({ barcodeFormats: ['qr-code'] })
      try {
        const barcodes = scanner.scanCodes(frame)
        expect(barcodes).toHaveLength(1)
        expect(barcodes[0]?.format).toBe('qr-code')
        expect(barcodes[0]?.rawValue).toBe('https://margelo.com')
      } finally {
        scanner.dispose()
        frame.dispose()
      }
    } finally {
      image.dispose()
    }
  })

  for (const orientation of ['up', 'right'] satisfies CameraOrientation[]) {
    it(`scans a Code 128 barcode from a Frame in orientation=${orientation}`, async () => {
      const image = await loadNitroImageFromAsset(code128Asset)
      try {
        const frame = HybridFrameConverter.convertImageToFrame(
          image,
          orientation,
          false,
        )
        const scanner = createBarcodeScanner({ barcodeFormats: ['code-128'] })
        try {
          const barcodes = await withTimeout(
            scanner.scanCodesAsync(frame),
            15_000,
            `scan Code 128 from ${orientation} Frame`,
          )
          expect(barcodes).toHaveLength(1)
          expect(barcodes[0]?.format).toBe('code-128')
          expect(barcodes[0]?.rawValue).toBe('https://mrousavy.com')
        } finally {
          scanner.dispose()
          frame.dispose()
        }
      } finally {
        image.dispose()
      }
    })
  }
})

async function scanCodesInAssetImage(
  source: number,
  barcodeFormats: TargetBarcodeFormat[],
): Promise<Barcode[]> {
  const image = await loadNitroImageFromAsset(source)
  return await scanLoadedImage(image, barcodeFormats)
}

async function loadNitroImageFromAsset(source: number): Promise<NitroImage> {
  const resolvedSource = RNImage.resolveAssetSource(source)
  const response = await fetch(resolvedSource.uri)
  const buffer = await response.arrayBuffer()

  return await loadImage({
    encodedImageData: {
      buffer,
      width: resolvedSource.width,
      height: resolvedSource.height,
      imageFormat: 'png',
    },
  })
}

async function scanLoadedImage(
  image: NitroImage,
  barcodeFormats: TargetBarcodeFormat[],
): Promise<Barcode[]> {
  const scanner = createBarcodeScanner({ barcodeFormats })
  try {
    return await withTimeout(
      scanner.scanCodesInImageAsync(image),
      15_000,
      `scan ${barcodeFormats.join(', ')} from image`,
    )
  } finally {
    scanner.dispose()
    image.dispose()
  }
}
