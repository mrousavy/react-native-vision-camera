# USB Camera Support Implementation Guide

## Overview

This document describes the implementation of USB Host camera support for react-native-vision-camera, enabling industrial inspection applications to use external USB cameras (UVC-compliant devices).

## Current Status

### iOS (iOS 17.0+)
✅ **Already Supported** - AVFoundation automatically detects and supports USB cameras through the `.external` device type.

**Key Features:**
- Automatic USB camera discovery
- Hot-plug detection (cameras appear/disappear dynamically)
- Full camera control (exposure, focus, zoom, etc.)
- Works with any UVC-compliant USB camera

**Requirements:**
- iOS 17.0 or later
- USB-C to USB-A adapter (if needed)
- Lightning to USB adapter (for older devices)

**Limitations:**
- Limited to devices with USB Host capability
- Requires appropriate iOS permissions

### Android
🚧 **In Progress** - Requires UVCCamera library integration for USB Video Class support.

**Implementation Plan:**
1. ✅ Add USB host permission to AndroidManifest.xml
2. ✅ Add UVCCamera library dependency
3. ⏳ Create USB camera detection classes
4. ⏳ Integrate with CameraDeviceFactory
5. ⏳ Test with common UVC cameras

## Architecture

### High-Level Flow
```
User App
    ↓
CameraDeviceFactory (discovers all cameras)
    ↓
├── Built-in Cameras (CameraX/AVFoundation)
└── USB Cameras (UVCCamera/AVFoundation.external)
    ↓
CameraDevice (unified interface)
    ↓
CameraSession → Outputs (Preview, Photo, Video)
```

### iOS Implementation

iOS uses the native AVFoundation framework:

```swift
// In HybridCameraDeviceFactory.swift
let discoverySession = AVCaptureDevice.DiscoverySession(
    deviceTypes: AVCaptureDevice.DeviceType.all, // Includes .external
    mediaType: nil,
    position: .unspecified
)

// Device types include:
// - .builtInWideAngleCamera
// - .builtInTelephotoCamera
// - .external (USB cameras, iOS 17.0+)
// - .continuityCamera
```

**Device Position Detection:**
```swift
// External/USB cameras are identified by deviceType
if device.deviceType == .external {
    return .external
}
```

### Android Implementation

Android requires the UVCCamera library for USB camera support:

#### Dependencies Added

```gradle
// build.gradle
repositories {
    maven { url 'https://jitpack.io' }
}

dependencies {
    implementation 'com.github.saki4510t:UVCCamera:2.4.9'
}
```

#### AndroidManifest Changes

```xml
<uses-feature android:name="android.hardware.usb.host" android:required="false" />
```

#### Proposed Class Structure

```
android/src/main/java/com/margelo/nitro/camera/
├── usb/
│   ├── USBCameraManager.kt        # Manages USB device discovery
│   ├── USBCameraDevice.kt         # Represents a USB camera
│   ├── UVCCameraHandler.kt        # Handles UVC camera operations
│   └── USBPermissionHelper.kt     # Manages USB permissions
└── HybridCameraDeviceFactory.kt   # Updated to include USB cameras
```

## TypeScript API

### Device Discovery

```typescript
import { useCameraDevices } from 'react-native-vision-camera';

function MyComponent() {
  const devices = useCameraDevices();

  // Filter for USB cameras
  const usbCameras = devices.filter(d =>
    d.position === 'external' || d.type === 'external'
  );

  console.log('USB Cameras:', usbCameras);

  return <Camera device={usbCameras[0]} isActive={true} />;
}
```

### Hot-Plug Detection

```typescript
import { addOnCameraDevicesChangedListener } from 'react-native-vision-camera';

useEffect(() => {
  const subscription = addOnCameraDevicesChangedListener((devices) => {
    const usbCameras = devices.filter(d => d.position === 'external');
    console.log('USB cameras changed:', usbCameras.length);
  });

  return () => subscription.remove();
}, []);
```

### Full Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCamera,
  addOnCameraDevicesChangedListener
} from 'react-native-vision-camera';

export function USBCameraScreen() {
  const devices = useCameraDevices();
  const [usbCamera, setUsbCamera] = useState(null);

  // Find USB camera
  useEffect(() => {
    const external = devices.find(d => d.position === 'external');
    setUsbCamera(external);
  }, [devices]);

  // Listen for USB camera plug/unplug
  useEffect(() => {
    const subscription = addOnCameraDevicesChangedListener((newDevices) => {
      const external = newDevices.find(d => d.position === 'external');
      setUsbCamera(external);

      if (external) {
        console.log('USB camera connected:', external.localizedName);
      } else {
        console.log('USB camera disconnected');
      }
    });

    return () => subscription.remove();
  }, []);

  const camera = useCamera({
    device: usbCamera,
    isActive: !!usbCamera,
  });

  if (!usbCamera) {
    return (
      <View style={styles.container}>
        <Text>Please connect a USB camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} />
      <Text style={styles.info}>
        Camera: {usbCamera.localizedName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  info: {
    position: 'absolute',
    top: 50,
    left: 20,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
});
```

## Testing

### Tested USB Cameras

#### iOS
- ✅ Logitech C920/C930
- ✅ Generic UVC webcams
- ✅ USB endoscope cameras

#### Android
- ⏳ Testing in progress

### Test Procedure

1. **Basic Connection**
   ```bash
   # Connect USB camera
   # Launch app
   # Verify camera appears in device list
   ```

2. **Hot-Plug Test**
   ```bash
   # App running
   # Plug in USB camera → should be detected
   # Unplug USB camera → should be removed from list
   ```

3. **Camera Session Test**
   ```bash
   # Select USB camera
   # Start preview → verify video stream
   # Take photo → verify capture works
   # Record video → verify recording works
   ```

## Limitations

### Current Limitations

1. **Single Camera Support**
   - Only one USB camera supported at a time
   - Multiple USB cameras may be detected but not all can be used simultaneously

2. **UVC Compliance Required**
   - Camera must be UVC (USB Video Class) compliant
   - Proprietary drivers not supported

3. **Platform Requirements**
   - iOS: Requires iOS 17.0+
   - Android: Requires USB Host capability (most modern devices)

4. **Performance**
   - Resolution and frame rate depend on USB bandwidth
   - USB 2.0: Up to 480 Mbps (typically 720p@30fps or 1080p@15fps)
   - USB 3.0: Up to 5 Gbps (1080p@60fps or 4K@30fps)

### Known Issues

- **Android:** CameraX does not natively support USB cameras, requiring UVCCamera workaround
- **iOS:** Requires iOS 17.0+, not available on older devices
- **Both:** Some USB cameras may require external power

## Permissions

### iOS (Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to the camera and external USB cameras for inspection</string>
```

### Android (AndroidManifest.xml)

```xml
<uses-feature android:name="android.hardware.usb.host" android:required="false" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Troubleshooting

### Camera Not Detected

**iOS:**
1. Check iOS version (17.0+ required)
2. Check USB connection and adapter
3. Try unplugging and replugging
4. Check camera permissions

**Android:**
1. Check USB OTG support on device
2. Grant USB permission when prompted
3. Check if camera is UVC-compliant
4. Try different USB cable/adapter

### Poor Video Quality

1. Check USB bandwidth (use USB 3.0 if available)
2. Lower resolution in camera settings
3. Check USB cable quality
4. Reduce frame rate

### App Crashes

1. Check USB permissions granted
2. Verify camera is UVC-compliant
3. Check device USB Host capability
4. Review app logs for specific errors

## Future Enhancements

### Planned Features

1. **Multiple USB Camera Support**
   - Simultaneous connections
   - Camera switching

2. **Advanced Controls**
   - Manual exposure control
   - White balance adjustment
   - Custom resolutions

3. **Network Camera Support**
   - WiFi/Ethernet cameras
   - RTSP streaming
   - MJPEG support

4. **Bluetooth Camera Support**
   - Low-bandwidth scenarios
   - Wireless connectivity

## References

- [iOS AVFoundation External Cameras](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype/external)
- [UVCCamera Library](https://github.com/saki4510t/UVCCamera)
- [USB Video Class Specification](https://www.usb.org/document-library/video-class-v15-document-set)
- [Android USB Host Documentation](https://developer.android.com/guide/topics/connectivity/usb/host)

## Support

For issues and questions:
- GitHub Issues: [react-native-vision-camera/issues](https://github.com/mrousavy/react-native-vision-camera/issues)
- Tag issues with `usb-camera` label

---

**Last Updated:** 2026-04-17
**Status:** In Development
**Target Release:** v5.1.0
