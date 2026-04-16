import fs from 'node:fs'
import path from 'node:path'

const docsRoot = path.resolve(process.cwd())

function assertFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${filePath}`)
  }
}

function assertFileDoesNotExist(filePath: string): void {
  if (fs.existsSync(filePath)) {
    throw new Error(`Expected file to not exist: ${filePath}`)
  }
}

function assertFileContains(filePath: string, content: string): void {
  const text = fs.readFileSync(filePath, 'utf8')
  if (!text.includes(content)) {
    throw new Error(`Expected file ${filePath} to include: ${content}`)
  }
}

function assertFileDoesNotContain(filePath: string, content: string): void {
  const text = fs.readFileSync(filePath, 'utf8')
  if (text.includes(content)) {
    throw new Error(`Expected file ${filePath} to not include: ${content}`)
  }
}

function assertFileDoesNotMatch(filePath: string, pattern: RegExp): void {
  const text = fs.readFileSync(filePath, 'utf8')
  if (pattern.test(text)) {
    throw new Error(
      `Expected file ${filePath} to not match: ${String(pattern)}`,
    )
  }
}

function collectMdxFiles(directoryPath: string): string[] {
  if (!fs.existsSync(directoryPath)) {
    return []
  }

  const files: string[] = []
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMdxFiles(entryPath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(entryPath)
    }
  }

  return files
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function assertHeadingLevels({
  files,
  heading,
  expectedLevel,
  requireAtLeastOne = false,
}: {
  files: string[]
  heading: string
  expectedLevel: number
  requireAtLeastOne?: boolean
}): void {
  const escapedHeading = escapeRegExp(heading)
  const headingPattern = new RegExp(`^(#{1,6})\\s+${escapedHeading}\\s*$`, 'gm')
  let totalMatches = 0

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8')
    headingPattern.lastIndex = 0
    for (const match of text.matchAll(headingPattern)) {
      totalMatches += 1
      const level = match[1]?.length ?? 0
      if (level !== expectedLevel) {
        throw new Error(
          `Expected heading "${heading}" to use level ${expectedLevel} in ${filePath}, but found level ${level}.`,
        )
      }
    }
  }

  if (requireAtLeastOne && totalMatches === 0) {
    throw new Error(
      `Expected to find heading "${heading}" in at least one file.`,
    )
  }
}

function assertHeadingAbsent(files: string[], heading: string): void {
  const escapedHeading = escapeRegExp(heading)
  const headingPattern = new RegExp(`^#{1,6}\\s+${escapedHeading}\\s*$`, 'm')
  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8')
    if (headingPattern.test(text)) {
      throw new Error(
        `Expected heading "${heading}" to be absent, but found it in ${filePath}.`,
      )
    }
  }
}

function countMatches(files: string[], pattern: RegExp): number {
  let count = 0
  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8')
    pattern.lastIndex = 0
    const matches = text.matchAll(pattern)
    for (const _ of matches) {
      count += 1
    }
  }
  return count
}

function assertMatchCountAtLeast(
  files: string[],
  pattern: RegExp,
  minimum: number,
  label: string,
): void {
  const count = countMatches(files, pattern)
  if (count < minimum) {
    throw new Error(
      `Expected at least ${minimum} matches for ${label}, but found ${count}.`,
    )
  }
}

function getHeadingSectionBody(
  text: string,
  heading: string,
  level = 4,
): string | null {
  const escapedHeading = escapeRegExp(heading)
  const pattern = new RegExp(
    `\\n${'#'.repeat(level)}\\s+${escapedHeading}\\n\\n([\\s\\S]*?)(?=\\n#{1,6}\\s+|\\n\\*\\*\\*\\n|$)`,
    'm',
  )
  const match = text.match(pattern)
  return match?.[1]?.trim() ?? null
}

function getMethodSectionBody(text: string, methodName: string): string | null {
  const escapedMethodName = escapeRegExp(methodName)
  const pattern = new RegExp(
    `\\n###\\s+${escapedMethodName}\\n\\n([\\s\\S]*?)(?=\\n###\\s+|\\n##\\s+|\\n\\*\\*\\*\\n|$)`,
    'm',
  )
  const match = text.match(pattern)
  return match?.[1]?.trim() ?? null
}

function firstNonEmptyLine(text: string): string | undefined {
  return text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
}

function getSubheadingEntries(
  text: string,
  level = 5,
): Array<{ heading: string; body: string }> {
  const pattern = new RegExp(
    `\\n${'#'.repeat(level)}\\s+([^\\n]+)\\n\\n([\\s\\S]*?)(?=\\n${'#'.repeat(level)}\\s+|$)`,
    'g',
  )

  const entries: Array<{ heading: string; body: string }> = []
  for (const match of text.matchAll(pattern)) {
    const heading = match[1]?.trim()
    const body = match[2]?.trim()
    if (heading != null && body != null) {
      entries.push({ heading, body })
    }
  }
  return entries
}

function stripFrontmatter(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) {
    return normalized
  }

  return normalized.replace(/^---\n[\s\S]*?\n---\n*/, '')
}

function getTypeLevelIntro(text: string): string | null {
  const body = stripFrontmatter(text)
  const match = body.match(/^```ts\n[\s\S]*?\n```\n\n([\s\S]*?)(?=\n##\s+|$)/)
  return match?.[1]?.trim() ?? null
}

function getContentAfterDeclaration(text: string): string | null {
  const body = stripFrontmatter(text)
  const match = body.match(/^```ts\n[\s\S]*?\n```\n\n([\s\S]*)$/)
  return match?.[1] ?? null
}

function assertHasTypeLevelIntro(filePath: string): void {
  const text = fs.readFileSync(filePath, 'utf8')
  const intro = getTypeLevelIntro(text)
  if (intro == null || intro.length === 0) {
    throw new Error(
      `Expected ${filePath} to include type-level intro content between the declaration block and the first member section.`,
    )
  }
}

function assertDoesNotJumpFromDeclarationToProperties(filePath: string): void {
  const text = fs.readFileSync(filePath, 'utf8')
  const contentAfterDeclaration = getContentAfterDeclaration(text)
  const firstLineAfterDeclaration = firstNonEmptyLine(
    contentAfterDeclaration ?? '',
  )
  if (firstLineAfterDeclaration === '## Properties') {
    throw new Error(
      `Expected ${filePath} to not jump directly from the declaration block to ## Properties.`,
    )
  }
}

function main(): void {
  const contentApiRoot = path.join(docsRoot, 'content', 'api')
  const apiFiles = collectMdxFiles(contentApiRoot)

  const cameraOutputPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'CameraOutput.mdx',
  )
  const cameraViewPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'views',
    'Camera.mdx',
  )
  const skiaCameraViewPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera-skia',
    'views',
    'SkiaCamera.mdx',
  )
  const barcodeCodeScannerViewPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera-barcode-scanner',
    'views',
    'CodeScanner.mdx',
  )
  const barcodeCodeScannerFunctionPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera-barcode-scanner',
    'functions',
    'CodeScanner.mdx',
  )

  const packageIndexPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'index.mdx',
  )
  const barcodePackageIndexPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera-barcode-scanner',
    'index.mdx',
  )

  const photoPagePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'Photo.mdx',
  )

  const cameraSessionPagePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'CameraSession.mdx',
  )
  const cameraSessionConnectionPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'interfaces',
    'CameraSessionConnection.mdx',
  )

  const cameraFrameOutputPagePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'CameraFrameOutput.mdx',
  )
  const cameraDepthFrameOutputPagePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'CameraDepthFrameOutput.mdx',
  )
  const hybridFrameConverterPagePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'variables',
    'HybridFrameConverter.mdx',
  )
  const useCameraPermissionFunctionPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'functions',
    'useCameraPermission.mdx',
  )
  const useCameraPermissionVariablePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'variables',
    'useCameraPermission.mdx',
  )
  const useMicrophonePermissionFunctionPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'functions',
    'useMicrophonePermission.mdx',
  )
  const useMicrophonePermissionVariablePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'variables',
    'useMicrophonePermission.mdx',
  )
  const getCameraDeviceFunctionPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'functions',
    'getCameraDevice.mdx',
  )
  const cameraPhotoOutputPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'CameraPhotoOutput.mdx',
  )
  const cameraVideoOutputPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'CameraVideoOutput.mdx',
  )
  const cameraObjectOutputPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'CameraObjectOutput.mdx',
  )
  const scannedObjectPath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'ScannedObject.mdx',
  )
  const scannedCodePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'ScannedCode.mdx',
  )
  const scannedFacePath = path.join(
    docsRoot,
    'content',
    'api',
    'react-native-vision-camera',
    'hybrid-objects',
    'ScannedFace.mdx',
  )
  const photoPageText = fs.readFileSync(photoPagePath, 'utf8')
  const getCameraDeviceText = fs.readFileSync(
    getCameraDeviceFunctionPath,
    'utf8',
  )

  assertFileExists(cameraOutputPath)
  assertFileExists(cameraViewPath)
  assertFileExists(skiaCameraViewPath)
  assertFileExists(barcodeCodeScannerViewPath)
  assertFileDoesNotExist(barcodeCodeScannerFunctionPath)
  assertFileExists(useCameraPermissionFunctionPath)
  assertFileExists(useMicrophonePermissionFunctionPath)
  assertFileDoesNotExist(useCameraPermissionVariablePath)
  assertFileDoesNotExist(useMicrophonePermissionVariablePath)
  assertFileContains(packageIndexPath, 'This is VisionCamera Core.')
  assertFileContains(
    barcodePackageIndexPath,
    'This is VisionCamera Barcode Scanner.',
  )
  assertFileContains(packageIndexPath, 'title: react-native-vision-camera')
  assertFileContains(packageIndexPath, 'tocPlatforms:')
  assertFileContains(photoPagePath, '\n#### See\n')
  assertFileContains(cameraSessionPagePath, 'CameraSessionConnection')
  assertFileContains(cameraSessionPagePath, 'CameraController')
  assertFileContains(
    cameraFrameOutputPagePath,
    'interface CameraFrameOutput extends CameraOutput',
  )
  assertFileDoesNotContain(
    cameraDepthFrameOutputPagePath,
    'NativeCameraOutput interface/protocol',
  )
  assertFileContains(
    cameraOutputPath,
    'interface CameraOutput extends HybridObject',
  )
  assertFileContains(
    cameraDepthFrameOutputPagePath,
    'hybridParent: CameraOutput',
  )
  assertFileContains(cameraObjectOutputPath, 'title: CameraObjectOutput')
  assertFileContains(cameraObjectOutputPath, 'hybridParent: CameraOutput')
  assertFileContains(cameraObjectOutputPath, 'platforms:')
  assertFileContains(cameraObjectOutputPath, '- iOS')
  assertHasTypeLevelIntro(cameraPhotoOutputPath)
  assertHasTypeLevelIntro(cameraVideoOutputPath)
  assertHasTypeLevelIntro(cameraFrameOutputPagePath)
  assertDoesNotJumpFromDeclarationToProperties(cameraPhotoOutputPath)
  assertDoesNotJumpFromDeclarationToProperties(cameraVideoOutputPath)
  assertDoesNotJumpFromDeclarationToProperties(cameraFrameOutputPagePath)
  assertFileDoesNotContain(cameraOutputPath, '\n## Extends\n')
  assertFileContains(cameraOutputPath, '\n#### Extended by\n')
  assertFileContains(cameraOutputPath, 'CameraObjectOutput')
  assertFileContains(cameraOutputPath, 'CameraDepthFrameOutput')
  assertFileContains(scannedObjectPath, 'ScannedCode')
  assertFileContains(scannedObjectPath, 'ScannedFace')
  assertFileContains(scannedCodePath, 'title: ScannedCode')
  assertFileContains(scannedCodePath, 'hybridParent: ScannedObject')
  assertFileContains(scannedCodePath, 'platforms:')
  assertFileContains(scannedCodePath, '- iOS')
  assertFileContains(scannedFacePath, 'title: ScannedFace')
  assertFileContains(scannedFacePath, 'hybridParent: ScannedObject')
  assertFileContains(scannedFacePath, 'platforms:')
  assertFileContains(scannedFacePath, '- iOS')
  assertFileContains(cameraOutputPath, '\n#### Discussion\n')
  assertFileContains(cameraSessionConnectionPath, '\n#### Discussion\n')
  assertFileContains(cameraSessionPagePath, '> [!WARNING] Throws')
  assertFileContains(getCameraDeviceFunctionPath, '\n#### Parameters\n')
  assertFileContains(getCameraDeviceFunctionPath, '\n##### position\n')
  assertFileContains(getCameraDeviceFunctionPath, '\n#### Returns\n')
  assertFileDoesNotMatch(
    getCameraDeviceFunctionPath,
    /function getCameraDevice[\s\S]*;\n```/m,
  )
  assertFileDoesNotMatch(
    cameraPhotoOutputPath,
    /readonly mediaType:[^\n]*;\n```/m,
  )
  assertFileDoesNotMatch(cameraPhotoOutputPath, /capturePhoto\([^\n]*;\n```/m)
  assertFileContains(cameraPhotoOutputPath, '> [!NOTE] Note')
  const saveToFileAsyncSection = getMethodSectionBody(
    photoPageText,
    'saveToFileAsync()',
  )
  if (saveToFileAsyncSection == null) {
    throw new Error('Expected Photo.saveToFileAsync() section to be present.')
  }
  if (saveToFileAsyncSection.includes('\n#### Returns\n')) {
    throw new Error(
      'Expected Photo.saveToFileAsync() to not render a Returns section when @returns is missing.',
    )
  }
  const getCameraDeviceReturns = getHeadingSectionBody(
    getCameraDeviceText,
    'Returns',
  )
  const getCameraDeviceParameters = getHeadingSectionBody(
    getCameraDeviceText,
    'Parameters',
  )
  if (getCameraDeviceReturns == null) {
    throw new Error(
      'Expected getCameraDevice() to render a Returns section when @returns is documented.',
    )
  }
  if (getCameraDeviceParameters == null) {
    throw new Error(
      'Expected getCameraDevice() to render a Parameters section when @param is documented.',
    )
  }
  const parameterEntries = getSubheadingEntries(
    `\n${getCameraDeviceParameters}`,
    5,
  )
  const hasUndocumentedDevicesEntry = parameterEntries.some((entry) => {
    return entry.heading === 'devices'
  })
  if (hasUndocumentedDevicesEntry) {
    throw new Error(
      'Expected getCameraDevice() to omit undocumented @param entries (like devices).',
    )
  }
  for (const parameterEntry of parameterEntries) {
    if (parameterEntry.body.length === 0) {
      throw new Error(
        `Expected @param "${parameterEntry.heading}" to be omitted when it has no description.`,
      )
    }

    const firstParameterLine = firstNonEmptyLine(parameterEntry.body) ?? ''
    if (
      firstParameterLine.startsWith('[') ||
      firstParameterLine.startsWith('`')
    ) {
      throw new Error(
        'Expected getCameraDevice() Parameters section to only contain @param text, not parameter types.',
      )
    }
  }
  const firstReturnsLine = firstNonEmptyLine(getCameraDeviceReturns) ?? ''
  if (firstReturnsLine.startsWith('[') || firstReturnsLine.startsWith('`')) {
    throw new Error(
      'Expected getCameraDevice() Returns section to only contain @returns text, not the return type.',
    )
  }
  assertFileContains(cameraDepthFrameOutputPagePath, '#### Inherited from')
  assertHeadingAbsent(apiFiles, 'Extends')
  assertHeadingAbsent(apiFiles, 'Note')
  assertHeadingAbsent(apiFiles, 'Throws')
  assertHeadingLevels({
    files: apiFiles,
    heading: 'Extended by',
    expectedLevel: 4,
    requireAtLeastOne: true,
  })
  assertHeadingLevels({
    files: apiFiles,
    heading: 'Inherited from',
    expectedLevel: 4,
    requireAtLeastOne: true,
  })
  assertHeadingLevels({
    files: apiFiles,
    heading: 'Parameters',
    expectedLevel: 4,
    requireAtLeastOne: true,
  })
  assertHeadingLevels({
    files: apiFiles,
    heading: 'Returns',
    expectedLevel: 4,
    requireAtLeastOne: true,
  })
  assertHeadingLevels({
    files: apiFiles,
    heading: 'See',
    expectedLevel: 4,
    requireAtLeastOne: true,
  })
  assertHeadingLevels({
    files: apiFiles,
    heading: 'Discussion',
    expectedLevel: 4,
    requireAtLeastOne: true,
  })
  assertMatchCountAtLeast(apiFiles, /> \[!NOTE\] Note/gm, 1, 'note admonitions')
  assertMatchCountAtLeast(
    apiFiles,
    /> \[!WARNING\] Throws/gm,
    1,
    'throws admonitions',
  )
  assertFileContains(
    hybridFrameConverterPagePath,
    '[`Frame`](../hybrid-objects/Frame.mdx)',
  )
  assertFileContains(
    hybridFrameConverterPagePath,
    '[`Depth`](../hybrid-objects/Depth.mdx)',
  )
  assertFileContains(
    hybridFrameConverterPagePath,
    '[`Image`](https://github.com/mrousavy/react-native-nitro-image)',
  )

  console.log('[verify-api-output] checks passed')
}

main()
