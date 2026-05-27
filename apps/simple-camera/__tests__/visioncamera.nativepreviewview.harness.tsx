import {
  type LayoutChangeEvent,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import {
  afterEach,
  beforeAll,
  cleanup,
  describe,
  expect,
  it,
  render,
} from 'react-native-harness'
import { callback } from 'react-native-nitro-modules'
import type {
  CameraDevice,
  CameraDeviceFactory,
  Point,
  PreviewImplementationMode,
  PreviewResizeMode,
  PreviewView,
} from 'react-native-vision-camera'
import { NativePreviewView, VisionCamera } from 'react-native-vision-camera'
import { deferred, withTimeout } from './test-utils'

interface Layout {
  x: number
  y: number
  width: number
  height: number
}

type SkipContext = {
  skip: (note?: string) => never
}

function toLayout(event: LayoutChangeEvent): Layout {
  const layout = event.nativeEvent.layout
  return {
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
  }
}

function expectPreviewGeometry(preview: PreviewView, layout: Layout) {
  expect(layout.width).toBeGreaterThan(0)
  expect(layout.height).toBeGreaterThan(0)

  const viewCenter: Point = { x: layout.width / 2, y: layout.height / 2 }
  const cameraPoint = preview.convertViewPointToCameraPoint(viewCenter)
  const roundTripped = preview.convertCameraPointToViewPoint(cameraPoint)
  expect(roundTripped.x).toBeCloseTo(viewCenter.x, 0)
  expect(roundTripped.y).toBeCloseTo(viewCenter.y, 0)

  const meteringPoint = preview.createMeteringPoint(viewCenter.x, viewCenter.y)
  expect(meteringPoint.relativeX).toBeCloseTo(viewCenter.x, 0)
  expect(meteringPoint.relativeY).toBeCloseTo(viewCenter.y, 0)
  expect(meteringPoint.normalizedX).toBeGreaterThanOrEqual(0)
  expect(meteringPoint.normalizedX).toBeLessThanOrEqual(1)
  expect(meteringPoint.normalizedY).toBeGreaterThanOrEqual(0)
  expect(meteringPoint.normalizedY).toBeLessThanOrEqual(1)
}

async function expectPreviewSnapshotDimensionsToMatchLayout(
  context: SkipContext,
  preview: PreviewView,
  layout: Layout,
) {
  if (Platform.OS !== 'android') {
    context.skip('takeSnapshot dimensions: Android only')
  }

  const snapshot = await preview.takeSnapshot()
  try {
    expect(snapshot.width).toBeGreaterThan(0)
    expect(snapshot.height).toBeGreaterThan(0)

    const expectedWidth = PixelRatio.getPixelSizeForLayoutSize(layout.width)
    const expectedHeight = PixelRatio.getPixelSizeForLayoutSize(layout.height)
    expect(snapshot.width).toBeCloseTo(expectedWidth, 0)
    expect(snapshot.height).toBeCloseTo(expectedHeight, 0)
  } finally {
    snapshot.dispose()
  }
}

describe('VisionCamera - NativePreviewView', () => {
  let factory: CameraDeviceFactory
  let backDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
  })

  afterEach(() => {
    cleanup()
  })

  it('starts a bare NativePreviewView and exposes ref methods', async (context) => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const previewRef = deferred<PreviewView>()
    const layout = deferred<Layout>()
    const previewStarted = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      previewRef.reject(error)
      layout.reject(error)
      previewStarted.reject(error)
    })

    try {
      await render(
        <NativePreviewView
          style={StyleSheet.absoluteFill}
          previewOutput={previewOutput}
          hybridRef={callback((preview: PreviewView) => {
            previewRef.resolve(preview)
          })}
          onLayout={(event) => {
            layout.resolve(toLayout(event))
          }}
          onPreviewStarted={callback(previewStarted.resolve)}
        />,
      )

      const preview = await withTimeout(
        previewRef.promise,
        10_000,
        'NativePreviewView hybridRef',
      )
      const previewLayout = await withTimeout(
        layout.promise,
        10_000,
        'NativePreviewView onLayout',
      )

      await session.start()
      await withTimeout(
        previewStarted.promise,
        15_000,
        'NativePreviewView onPreviewStarted',
      )

      expectPreviewGeometry(preview, previewLayout)
      await expectPreviewSnapshotDimensionsToMatchLayout(
        context,
        preview,
        previewLayout,
      )
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('keeps a flex preview laid out inside a padded overflow-hidden parent', async (context) => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const previewRef = deferred<PreviewView>()
    const layout = deferred<Layout>()
    const previewStarted = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      previewRef.reject(error)
      layout.reject(error)
      previewStarted.reject(error)
    })

    try {
      await render(
        <View style={styles.issuePaddedContainer}>
          <NativePreviewView
            style={styles.issueFlexPreview}
            previewOutput={previewOutput}
            hybridRef={callback((preview: PreviewView) => {
              previewRef.resolve(preview)
            })}
            onLayout={(event) => {
              layout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(previewStarted.resolve)}
          />
        </View>,
      )

      const preview = await withTimeout(
        previewRef.promise,
        10_000,
        'padded NativePreviewView hybridRef',
      )
      const previewLayout = await withTimeout(
        layout.promise,
        10_000,
        'padded NativePreviewView onLayout',
      )

      await session.start()
      await withTimeout(
        previewStarted.promise,
        15_000,
        'padded NativePreviewView onPreviewStarted',
      )

      expect(previewLayout.x).toBeCloseTo(0, 0)
      expect(previewLayout.y).toBeCloseTo(PADDING_TOP, 0)
      expect(previewLayout.height).toBeGreaterThan(0)
      expectPreviewGeometry(preview, previewLayout)
      await expectPreviewSnapshotDimensionsToMatchLayout(
        context,
        preview,
        previewLayout,
      )
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('survives repeated conditional placeholder-to-preview mounts in a padded parent', async (context) => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const session = await VisionCamera.createCameraSession(false)
      const previewOutput = VisionCamera.createPreviewOutput()
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      const previewRef = deferred<PreviewView>()
      const layout = deferred<Layout>()
      const previewStarted = deferred()
      const errorSub = session.addOnErrorListener((error) => {
        previewRef.reject(error)
        layout.reject(error)
        previewStarted.reject(error)
      })

      try {
        const { rerender } = await render(
          <View style={styles.issuePaddedContainer}>
            <View style={styles.placeholder} />
          </View>,
        )

        await rerender(
          <View style={styles.issuePaddedContainer}>
            <NativePreviewView
              style={styles.issueFlexPreview}
              previewOutput={previewOutput}
              hybridRef={callback((preview: PreviewView) => {
                previewRef.resolve(preview)
              })}
              onLayout={(event) => {
                layout.resolve(toLayout(event))
              }}
              onPreviewStarted={callback(previewStarted.resolve)}
            />
          </View>,
        )

        const preview = await withTimeout(
          previewRef.promise,
          10_000,
          `conditional NativePreviewView hybridRef attempt ${attempt}`,
        )
        const previewLayout = await withTimeout(
          layout.promise,
          10_000,
          `conditional NativePreviewView onLayout attempt ${attempt}`,
        )

        await session.start()
        await withTimeout(
          previewStarted.promise,
          15_000,
          `conditional NativePreviewView onPreviewStarted attempt ${attempt}`,
        )

        expect(previewLayout.x).toBeCloseTo(0, 0)
        expect(previewLayout.y).toBeCloseTo(PADDING_TOP, 0)
        expectPreviewGeometry(preview, previewLayout)
        await expectPreviewSnapshotDimensionsToMatchLayout(
          context,
          preview,
          previewLayout,
        )
      } finally {
        errorSub.remove()
        await session.stop()
        cleanup()
      }
    }
  })

  it('keeps a fixed 150x300 preview centered on first mount', async (context) => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const previewRef = deferred<PreviewView>()
    const rootLayout = deferred<Layout>()
    const wrapperLayout = deferred<Layout>()
    const previewLayout = deferred<Layout>()
    const previewStarted = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      previewRef.reject(error)
      rootLayout.reject(error)
      wrapperLayout.reject(error)
      previewLayout.reject(error)
      previewStarted.reject(error)
    })

    try {
      await render(
        <View
          style={styles.centeredRoot}
          onLayout={(event) => {
            rootLayout.resolve(toLayout(event))
          }}
        >
          <View
            style={styles.fixedPreviewWrapper}
            onLayout={(event) => {
              wrapperLayout.resolve(toLayout(event))
            }}
          >
            <NativePreviewView
              style={styles.fixedPreview}
              previewOutput={previewOutput}
              hybridRef={callback((preview: PreviewView) => {
                previewRef.resolve(preview)
              })}
              onLayout={(event) => {
                previewLayout.resolve(toLayout(event))
              }}
              onPreviewStarted={callback(previewStarted.resolve)}
            />
          </View>
        </View>,
      )

      const root = await withTimeout(
        rootLayout.promise,
        10_000,
        'fixed preview root onLayout',
      )
      const wrapper = await withTimeout(
        wrapperLayout.promise,
        10_000,
        'fixed preview wrapper onLayout',
      )
      const preview = await withTimeout(
        previewRef.promise,
        10_000,
        'fixed NativePreviewView hybridRef',
      )
      const layout = await withTimeout(
        previewLayout.promise,
        10_000,
        'fixed NativePreviewView onLayout',
      )

      await session.start()
      await withTimeout(
        previewStarted.promise,
        15_000,
        'fixed NativePreviewView onPreviewStarted',
      )

      const expectedWrapperX = (root.width - FIXED_PREVIEW_WIDTH) / 2
      const expectedWrapperY = (root.height - FIXED_PREVIEW_HEIGHT) / 2
      expect(wrapper.width).toBeCloseTo(FIXED_PREVIEW_WIDTH, 0)
      expect(wrapper.height).toBeCloseTo(FIXED_PREVIEW_HEIGHT, 0)
      expect(wrapper.x).toBeCloseTo(expectedWrapperX, 0)
      expect(wrapper.y).toBeCloseTo(expectedWrapperY, 0)
      expect(layout.x).toBeCloseTo(0, 0)
      expect(layout.y).toBeCloseTo(0, 0)
      expect(layout.width).toBeCloseTo(FIXED_PREVIEW_WIDTH, 0)
      expect(layout.height).toBeCloseTo(FIXED_PREVIEW_HEIGHT, 0)
      expectPreviewGeometry(preview, layout)
      await expectPreviewSnapshotDimensionsToMatchLayout(context, preview, layout)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('updates geometry when the preview layout changes while running', async (context) => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const previewRef = deferred<PreviewView>()
    const firstLayout = deferred<Layout>()
    const secondLayout = deferred<Layout>()
    const previewStarted = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      previewRef.reject(error)
      firstLayout.reject(error)
      secondLayout.reject(error)
      previewStarted.reject(error)
    })

    try {
      const { rerender } = await render(
        <View style={styles.centeredRoot}>
          <NativePreviewView
            style={[styles.resizablePreview, styles.tallPreview]}
            previewOutput={previewOutput}
            hybridRef={callback((preview: PreviewView) => {
              previewRef.resolve(preview)
            })}
            onLayout={(event) => {
              firstLayout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(previewStarted.resolve)}
          />
        </View>,
      )

      const preview = await withTimeout(
        previewRef.promise,
        10_000,
        'resizable NativePreviewView hybridRef',
      )
      const first = await withTimeout(
        firstLayout.promise,
        10_000,
        'resizable NativePreviewView first onLayout',
      )

      await session.start()
      await withTimeout(
        previewStarted.promise,
        15_000,
        'resizable NativePreviewView onPreviewStarted',
      )

      expect(first.width).toBeCloseTo(FIXED_PREVIEW_WIDTH, 0)
      expect(first.height).toBeCloseTo(FIXED_PREVIEW_HEIGHT, 0)
      expectPreviewGeometry(preview, first)

      await rerender(
        <View style={styles.centeredRoot}>
          <NativePreviewView
            style={[styles.resizablePreview, styles.widePreview]}
            previewOutput={previewOutput}
            hybridRef={callback((preview: PreviewView) => {
              previewRef.resolve(preview)
            })}
            onLayout={(event) => {
              secondLayout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(previewStarted.resolve)}
          />
        </View>,
      )

      const second = await withTimeout(
        secondLayout.promise,
        10_000,
        'resizable NativePreviewView second onLayout',
      )
      expect(second.width).toBeCloseTo(WIDE_PREVIEW_WIDTH, 0)
      expect(second.height).toBeCloseTo(WIDE_PREVIEW_HEIGHT, 0)
      expectPreviewGeometry(preview, second)
      await expectPreviewSnapshotDimensionsToMatchLayout(context, preview, second)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('starts a new NativePreviewView after the previous one unmounts', async () => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const session = await VisionCamera.createCameraSession(false)
      const previewOutput = VisionCamera.createPreviewOutput()
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      const previewRef = deferred<PreviewView>()
      const layout = deferred<Layout>()
      const previewStarted = deferred()
      const errorSub = session.addOnErrorListener((error) => {
        previewRef.reject(error)
        layout.reject(error)
        previewStarted.reject(error)
      })

      try {
        await render(
          <NativePreviewView
            style={StyleSheet.absoluteFill}
            previewOutput={previewOutput}
            hybridRef={callback((preview: PreviewView) => {
              previewRef.resolve(preview)
            })}
            onLayout={(event) => {
              layout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(previewStarted.resolve)}
          />,
        )

        const preview = await withTimeout(
          previewRef.promise,
          10_000,
          `remounted NativePreviewView hybridRef attempt ${attempt}`,
        )
        const previewLayout = await withTimeout(
          layout.promise,
          10_000,
          `remounted NativePreviewView onLayout attempt ${attempt}`,
        )

        await session.start()
        await withTimeout(
          previewStarted.promise,
          15_000,
          `remounted NativePreviewView onPreviewStarted attempt ${attempt}`,
        )

        expectPreviewGeometry(preview, previewLayout)
        cleanup()
      } finally {
        errorSub.remove()
        await session.stop()
        cleanup()
      }
    }
  })

  it('switches a running session between two mounted NativePreviewViews', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const firstPreviewOutput = VisionCamera.createPreviewOutput()
    const secondPreviewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: firstPreviewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const firstRef = deferred<PreviewView>()
    const secondRef = deferred<PreviewView>()
    const firstLayout = deferred<Layout>()
    const secondLayout = deferred<Layout>()
    const firstPreviewStarted = deferred()
    const secondPreviewStarted = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      firstRef.reject(error)
      secondRef.reject(error)
      firstLayout.reject(error)
      secondLayout.reject(error)
      firstPreviewStarted.reject(error)
      secondPreviewStarted.reject(error)
    })

    try {
      await render(
        <View style={styles.switchRoot}>
          <NativePreviewView
            style={styles.switchPreview}
            previewOutput={firstPreviewOutput}
            hybridRef={callback((preview: PreviewView) => {
              firstRef.resolve(preview)
            })}
            onLayout={(event) => {
              firstLayout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(firstPreviewStarted.resolve)}
          />
          <NativePreviewView
            style={styles.switchPreview}
            previewOutput={secondPreviewOutput}
            hybridRef={callback((preview: PreviewView) => {
              secondRef.resolve(preview)
            })}
            onLayout={(event) => {
              secondLayout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(secondPreviewStarted.resolve)}
          />
        </View>,
      )

      const firstPreview = await withTimeout(
        firstRef.promise,
        10_000,
        'first NativePreviewView hybridRef',
      )
      const secondPreview = await withTimeout(
        secondRef.promise,
        10_000,
        'second NativePreviewView hybridRef',
      )
      const firstPreviewLayout = await withTimeout(
        firstLayout.promise,
        10_000,
        'first NativePreviewView onLayout',
      )
      const secondPreviewLayout = await withTimeout(
        secondLayout.promise,
        10_000,
        'second NativePreviewView onLayout',
      )

      await session.start()
      await withTimeout(
        firstPreviewStarted.promise,
        15_000,
        'first NativePreviewView onPreviewStarted',
      )
      expectPreviewGeometry(firstPreview, firstPreviewLayout)

      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: secondPreviewOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])
      await withTimeout(
        secondPreviewStarted.promise,
        15_000,
        'second NativePreviewView onPreviewStarted',
      )
      expectPreviewGeometry(secondPreview, secondPreviewLayout)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('mounts two NativePreviewViews from two preview outputs in one multi-cam session', async (context) => {
    if (VisionCamera.supportsMultiCamSessions === false) {
      context.skip('two NativePreviewViews: multi-cam not supported')
    }
    const combination = factory.supportedMultiCamDeviceCombinations.find(
      (devices) => devices.length >= 2,
    )
    if (combination == null) {
      context.skip(
        'two NativePreviewViews: no multi-cam combination with two devices',
      )
    }

    const firstDevice = combination[0]
    const secondDevice = combination[1]
    if (firstDevice == null) throw new Error('missing first multi-cam device')
    if (secondDevice == null) throw new Error('missing second multi-cam device')

    const session = await VisionCamera.createCameraSession(true)
    const firstPreviewOutput = VisionCamera.createPreviewOutput()
    const secondPreviewOutput = VisionCamera.createPreviewOutput()
    const controllers = await session.configure([
      {
        input: firstDevice,
        outputs: [{ output: firstPreviewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
      {
        input: secondDevice,
        outputs: [{ output: secondPreviewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    const controllerDeviceIds = controllers.map(
      (controller) => controller.device.id,
    )
    const expectedDeviceIds = [firstDevice.id, secondDevice.id]
    expect(controllerDeviceIds).toEqual(expectedDeviceIds)

    const firstRef = deferred<PreviewView>()
    const secondRef = deferred<PreviewView>()
    const firstLayout = deferred<Layout>()
    const secondLayout = deferred<Layout>()
    const firstPreviewStarted = deferred()
    const secondPreviewStarted = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      firstRef.reject(error)
      secondRef.reject(error)
      firstLayout.reject(error)
      secondLayout.reject(error)
      firstPreviewStarted.reject(error)
      secondPreviewStarted.reject(error)
    })

    try {
      await render(
        <View style={styles.switchRoot}>
          <NativePreviewView
            style={styles.switchPreview}
            previewOutput={firstPreviewOutput}
            hybridRef={callback((preview: PreviewView) => {
              firstRef.resolve(preview)
            })}
            onLayout={(event) => {
              firstLayout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(firstPreviewStarted.resolve)}
          />
          <NativePreviewView
            style={styles.switchPreview}
            previewOutput={secondPreviewOutput}
            hybridRef={callback((preview: PreviewView) => {
              secondRef.resolve(preview)
            })}
            onLayout={(event) => {
              secondLayout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(secondPreviewStarted.resolve)}
          />
        </View>,
      )

      const firstPreview = await withTimeout(
        firstRef.promise,
        10_000,
        'first multi-cam NativePreviewView hybridRef',
      )
      const secondPreview = await withTimeout(
        secondRef.promise,
        10_000,
        'second multi-cam NativePreviewView hybridRef',
      )
      const firstPreviewLayout = await withTimeout(
        firstLayout.promise,
        10_000,
        'first multi-cam NativePreviewView onLayout',
      )
      const secondPreviewLayout = await withTimeout(
        secondLayout.promise,
        10_000,
        'second multi-cam NativePreviewView onLayout',
      )

      await session.start()
      await withTimeout(
        firstPreviewStarted.promise,
        15_000,
        'first multi-cam NativePreviewView onPreviewStarted',
      )
      await withTimeout(
        secondPreviewStarted.promise,
        15_000,
        'second multi-cam NativePreviewView onPreviewStarted',
      )

      expectPreviewGeometry(firstPreview, firstPreviewLayout)
      expectPreviewGeometry(secondPreview, secondPreviewLayout)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('attaches native gesture controllers to a NativePreviewView', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    const [controller] = await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])
    if (controller == null) throw new Error('no controller')

    const tapGesture = VisionCamera.createTapToFocusGestureController()
    const zoomGesture = VisionCamera.createZoomGestureController()
    tapGesture.controller = controller
    zoomGesture.controller = controller

    const previewRef = deferred<PreviewView>()
    const layout = deferred<Layout>()
    const previewStarted = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      previewRef.reject(error)
      layout.reject(error)
      previewStarted.reject(error)
    })

    try {
      await render(
        <NativePreviewView
          style={StyleSheet.absoluteFill}
          previewOutput={previewOutput}
          gestureControllers={[tapGesture, zoomGesture]}
          hybridRef={callback((preview: PreviewView) => {
            previewRef.resolve(preview)
          })}
          onLayout={(event) => {
            layout.resolve(toLayout(event))
          }}
          onPreviewStarted={callback(previewStarted.resolve)}
        />,
      )

      const preview = await withTimeout(
        previewRef.promise,
        10_000,
        'gesture NativePreviewView hybridRef',
      )
      const previewLayout = await withTimeout(
        layout.promise,
        10_000,
        'gesture NativePreviewView onLayout',
      )

      await session.start()
      await withTimeout(
        previewStarted.promise,
        15_000,
        'gesture NativePreviewView onPreviewStarted',
      )

      expectPreviewGeometry(preview, previewLayout)
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })

  it('supports cover and contain resizeMode previews', async (context) => {
    const resizeModes: PreviewResizeMode[] = ['cover', 'contain']
    let coverTopLeft: Point | undefined
    let containTopLeft: Point | undefined

    for (const resizeMode of resizeModes) {
      const session = await VisionCamera.createCameraSession(false)
      const previewOutput = VisionCamera.createPreviewOutput()
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      const previewRef = deferred<PreviewView>()
      const layout = deferred<Layout>()
      const previewStarted = deferred()
      const errorSub = session.addOnErrorListener((error) => {
        previewRef.reject(error)
        layout.reject(error)
        previewStarted.reject(error)
      })

      try {
        await render(
          <View style={styles.centeredRoot}>
            <View style={styles.fixedPreviewWrapper}>
              <NativePreviewView
                style={styles.fixedPreview}
                previewOutput={previewOutput}
                resizeMode={resizeMode}
                hybridRef={callback((preview: PreviewView) => {
                  previewRef.resolve(preview)
                })}
                onLayout={(event) => {
                  layout.resolve(toLayout(event))
                }}
                onPreviewStarted={callback(previewStarted.resolve)}
              />
            </View>
          </View>,
        )

        const preview = await withTimeout(
          previewRef.promise,
          10_000,
          `${resizeMode} NativePreviewView hybridRef`,
        )
        const previewLayout = await withTimeout(
          layout.promise,
          10_000,
          `${resizeMode} NativePreviewView onLayout`,
        )

        await session.start()
        await withTimeout(
          previewStarted.promise,
          15_000,
          `${resizeMode} NativePreviewView onPreviewStarted`,
        )

        expectPreviewGeometry(preview, previewLayout)
        await expectPreviewSnapshotDimensionsToMatchLayout(
          context,
          preview,
          previewLayout,
        )
        const topLeft = preview.convertViewPointToCameraPoint({ x: 0, y: 0 })
        if (resizeMode === 'cover') coverTopLeft = topLeft
        else containTopLeft = topLeft
      } finally {
        errorSub.remove()
        await session.stop()
        cleanup()
      }
    }

    if (coverTopLeft == null) throw new Error('missing cover top-left point')
    if (containTopLeft == null)
      throw new Error('missing contain top-left point')
    const roundedCoverTopLeft = {
      x: Number(coverTopLeft.x.toFixed(3)),
      y: Number(coverTopLeft.y.toFixed(3)),
    }
    const roundedContainTopLeft = {
      x: Number(containTopLeft.x.toFixed(3)),
      y: Number(containTopLeft.y.toFixed(3)),
    }
    expect(roundedCoverTopLeft).not.toEqual(roundedContainTopLeft)
  })

  it('supports both Android preview implementation modes', async (context) => {
    if (Platform.OS !== 'android') {
      context.skip('implementationMode: Android only')
    }

    const implementationModes: PreviewImplementationMode[] = [
      'performance',
      'compatible',
    ]

    for (const implementationMode of implementationModes) {
      const session = await VisionCamera.createCameraSession(false)
      const previewOutput = VisionCamera.createPreviewOutput()
      await session.configure([
        {
          input: backDevice,
          outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
          constraints: [],
        },
      ])

      const previewRef = deferred<PreviewView>()
      const layout = deferred<Layout>()
      const previewStarted = deferred()
      const errorSub = session.addOnErrorListener((error) => {
        previewRef.reject(error)
        layout.reject(error)
        previewStarted.reject(error)
      })

      try {
        await render(
          <NativePreviewView
            style={StyleSheet.absoluteFill}
            previewOutput={previewOutput}
            implementationMode={implementationMode}
            hybridRef={callback((preview: PreviewView) => {
              previewRef.resolve(preview)
            })}
            onLayout={(event) => {
              layout.resolve(toLayout(event))
            }}
            onPreviewStarted={callback(previewStarted.resolve)}
          />,
        )

        const preview = await withTimeout(
          previewRef.promise,
          10_000,
          `${implementationMode} NativePreviewView hybridRef`,
        )
        const previewLayout = await withTimeout(
          layout.promise,
          10_000,
          `${implementationMode} NativePreviewView onLayout`,
        )

        await session.start()
        await withTimeout(
          previewStarted.promise,
          15_000,
          `${implementationMode} NativePreviewView onPreviewStarted`,
        )

        expectPreviewGeometry(preview, previewLayout)
        await expectPreviewSnapshotDimensionsToMatchLayout(
          context,
          preview,
          previewLayout,
        )
      } finally {
        errorSub.remove()
        await session.stop()
        cleanup()
      }
    }
  })

  it('fires preview callbacks when the session starts and stops', async () => {
    const session = await VisionCamera.createCameraSession(false)
    const previewOutput = VisionCamera.createPreviewOutput()
    await session.configure([
      {
        input: backDevice,
        outputs: [{ output: previewOutput, mirrorMode: 'auto' }],
        constraints: [],
      },
    ])

    const previewRef = deferred<PreviewView>()
    const layout = deferred<Layout>()
    const previewStarted = deferred()
    const previewStopped = deferred()
    const errorSub = session.addOnErrorListener((error) => {
      previewRef.reject(error)
      layout.reject(error)
      previewStarted.reject(error)
      previewStopped.reject(error)
    })

    try {
      await render(
        <NativePreviewView
          style={StyleSheet.absoluteFill}
          previewOutput={previewOutput}
          hybridRef={callback((preview: PreviewView) => {
            previewRef.resolve(preview)
          })}
          onLayout={(event) => {
            layout.resolve(toLayout(event))
          }}
          onPreviewStarted={callback(previewStarted.resolve)}
          onPreviewStopped={callback(previewStopped.resolve)}
        />,
      )

      await withTimeout(
        previewRef.promise,
        10_000,
        'callback NativePreviewView hybridRef',
      )
      await withTimeout(
        layout.promise,
        10_000,
        'callback NativePreviewView onLayout',
      )

      await session.start()
      await withTimeout(
        previewStarted.promise,
        15_000,
        'callback NativePreviewView onPreviewStarted',
      )

      await session.stop()
      await withTimeout(
        previewStopped.promise,
        10_000,
        'callback NativePreviewView onPreviewStopped',
      )
    } finally {
      errorSub.remove()
      await session.stop()
    }
  })
})

const PADDING_TOP = 82
const FIXED_PREVIEW_WIDTH = 150
const FIXED_PREVIEW_HEIGHT = 300
const WIDE_PREVIEW_WIDTH = 260
const WIDE_PREVIEW_HEIGHT = 180

const styles = StyleSheet.create({
  centeredRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  fixedPreviewWrapper: {
    width: FIXED_PREVIEW_WIDTH,
    height: FIXED_PREVIEW_HEIGHT,
  },
  fixedPreview: {
    width: FIXED_PREVIEW_WIDTH,
    height: FIXED_PREVIEW_HEIGHT,
    backgroundColor: 'black',
  },
  resizablePreview: {
    backgroundColor: 'black',
  },
  tallPreview: {
    width: FIXED_PREVIEW_WIDTH,
    height: FIXED_PREVIEW_HEIGHT,
  },
  widePreview: {
    width: WIDE_PREVIEW_WIDTH,
    height: WIDE_PREVIEW_HEIGHT,
  },
  issuePaddedContainer: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: PADDING_TOP,
    overflow: 'hidden',
  },
  issueFlexPreview: {
    flex: 1,
    backgroundColor: 'black',
  },
  placeholder: {
    flex: 1,
    backgroundColor: 'black',
  },
  switchRoot: {
    flex: 1,
    backgroundColor: 'black',
  },
  switchPreview: {
    flex: 1,
    backgroundColor: 'black',
  },
})
