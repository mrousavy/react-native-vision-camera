# USB 摄像头支持说明

## 概述

本文档说明如何在 react-native-vision-camera 中使用 USB Host 连接的外部摄像头，用于工业检测等应用场景。

## 支持情况

### iOS (iOS 17.0+)
✅ **已完全支持** - 通过 AVFoundation 自动识别和支持 USB 摄像头

**功能特性：**
- 自动发现 USB 摄像头
- 热插拔检测（设备动态插拔）
- 完整的相机控制（曝光、对焦、变焦等）
- 支持所有符合 UVC 标准的 USB 摄像头

**系统要求：**
- iOS 17.0 或更高版本
- USB-C 转 USB-A 转接器（如需要）
- Lightning 转 USB 转接器（旧设备）

### Android
🚧 **正在实现** - 已添加 UVCCamera 库支持

**已完成：**
- ✅ 添加 USB Host 权限声明
- ✅ 添加 UVCCamera 库依赖
- ✅ 添加 JitPack 仓库配置

**待完成：**
- ⏳ USB 摄像头检测和管理类
- ⏳ 集成到 CameraDeviceFactory
- ⏳ 测试常见 USB 摄像头

## 快速开始

### 1. 检查设备支持

```typescript
import { useCameraDevices } from 'react-native-vision-camera';

function checkUSBSupport() {
  const devices = useCameraDevices();

  // 查找 USB 摄像头
  const usbCameras = devices.filter(device =>
    device.position === 'external' || device.type === 'external'
  );

  if (usbCameras.length > 0) {
    console.log('找到 USB 摄像头:', usbCameras[0].localizedName);
  } else {
    console.log('未检测到 USB 摄像头');
  }
}
```

### 2. 使用 USB 摄像头

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useCameraDevices, useCamera } from 'react-native-vision-camera';

export function IndustrialInspectionScreen() {
  const devices = useCameraDevices();
  const [usbCamera, setUsbCamera] = useState(null);

  // 查找 USB 摄像头
  useEffect(() => {
    const external = devices.find(d => d.position === 'external');
    setUsbCamera(external);
  }, [devices]);

  const camera = useCamera({
    device: usbCamera,
    isActive: !!usbCamera,
  });

  if (!usbCamera) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>请连接 USB 摄像头</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} />
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          摄像头: {usbCamera.localizedName}
        </Text>
        <Text style={styles.infoText}>
          分辨率: {usbCamera.getSupportedResolutions('photo')[0]?.width} x {usbCamera.getSupportedResolutions('photo')[0]?.height}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  infoBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
});
```

### 3. 监听热插拔事件

```typescript
import { addOnCameraDevicesChangedListener } from 'react-native-vision-camera';

useEffect(() => {
  const subscription = addOnCameraDevicesChangedListener((devices) => {
    const usbCameras = devices.filter(d => d.position === 'external');

    if (usbCameras.length > 0) {
      console.log('USB 摄像头已连接');
      setUsbCamera(usbCameras[0]);
    } else {
      console.log('USB 摄像头已断开');
      setUsbCamera(null);
    }
  });

  return () => subscription.remove();
}, []);
```

## 工业检测完整示例

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCamera,
  usePhotoOutput,
  addOnCameraDevicesChangedListener,
} from 'react-native-vision-camera';

export function IndustrialInspectionApp() {
  const devices = useCameraDevices();
  const [usbCamera, setUsbCamera] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  // USB 摄像头检测
  useEffect(() => {
    const external = devices.find(d => d.position === 'external');
    setUsbCamera(external);
    setIsConnected(!!external);
  }, [devices]);

  // 热插拔监听
  useEffect(() => {
    const subscription = addOnCameraDevicesChangedListener((newDevices) => {
      const external = newDevices.find(d => d.position === 'external');

      if (external && !isConnected) {
        Alert.alert('提示', 'USB 摄像头已连接');
        setUsbCamera(external);
        setIsConnected(true);
      } else if (!external && isConnected) {
        Alert.alert('警告', 'USB 摄像头已断开');
        setUsbCamera(null);
        setIsConnected(false);
      }
    });

    return () => subscription.remove();
  }, [isConnected]);

  // 相机控制
  const camera = useCamera({
    device: usbCamera,
    isActive: isConnected,
  });

  // 拍照输出
  const photoOutput = usePhotoOutput({
    device: usbCamera,
    targetResolution: { width: 1920, height: 1080 },
  });

  // 拍照功能
  const handleCapture = async () => {
    if (!photoOutput) {
      Alert.alert('错误', '相机未就绪');
      return;
    }

    try {
      const photo = await photoOutput.capture({
        enableShutterSound: false,
      });

      setPhotoCount(prev => prev + 1);
      console.log('照片已保存:', photo.path);
      Alert.alert('成功', `检测照片已保存 (${photoCount + 1})`);
    } catch (error) {
      Alert.alert('错误', '拍照失败: ' + error.message);
    }
  };

  // 未连接状态
  if (!isConnected || !usbCamera) {
    return (
      <View style={styles.container}>
        <View style={styles.disconnectedBox}>
          <Text style={styles.disconnectedTitle}>⚠️ 设备未连接</Text>
          <Text style={styles.disconnectedText}>
            请连接 USB 摄像头以开始检测
          </Text>
          <Text style={styles.hint}>
            支持的设备：UVC 标准 USB 摄像头
          </Text>
        </View>
      </View>
    );
  }

  // 已连接状态
  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} />

      {/* 相机信息 */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📹 设备信息</Text>
        <Text style={styles.infoText}>名称: {usbCamera.localizedName}</Text>
        <Text style={styles.infoText}>制造商: {usbCamera.manufacturer}</Text>
        <Text style={styles.infoText}>型号: {usbCamera.modelID}</Text>
        <Text style={styles.infoText}>已拍摄: {photoCount} 张</Text>
      </View>

      {/* 控制按钮 */}
      <View style={styles.controlBox}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
        >
          <Text style={styles.captureButtonText}>拍摄检测照片</Text>
        </TouchableOpacity>
      </View>

      {/* 状态指示器 */}
      <View style={styles.statusIndicator}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>设备已连接</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  disconnectedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  disconnectedTitle: {
    fontSize: 24,
    color: '#FF9500',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  disconnectedText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  infoBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
    minWidth: 250,
  },
  infoTitle: {
    color: '#4CD964',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: 'white',
    fontSize: 13,
    marginBottom: 5,
  },
  controlBox: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CD964',
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
});
```

## 配置说明

### iOS 配置

在 `Info.plist` 中添加相机权限：

```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机和外部 USB 摄像头进行工业检测</string>
```

### Android 配置

权限已自动添加到库的 AndroidManifest.xml 中，无需额外配置。

## 技术限制

### 当前限制

1. **单路摄像头支持**
   - 当前仅支持单个 USB 摄像头连接
   - 可检测多个但只能同时使用一个

2. **UVC 标准要求**
   - 摄像头必须符合 UVC (USB Video Class) 标准
   - 不支持专有驱动的摄像头

3. **平台要求**
   - iOS: 需要 iOS 17.0 或更高版本
   - Android: 需要支持 USB Host 的设备（大部分现代设备）

4. **性能限制**
   - 分辨率和帧率受 USB 带宽限制
   - USB 2.0: 最高约 480 Mbps (通常支持 720p@30fps 或 1080p@15fps)
   - USB 3.0: 最高约 5 Gbps (支持 1080p@60fps 或 4K@30fps)

## 已测试设备

### iOS
- ✅ Logitech C920/C930 高清摄像头
- ✅ 通用 UVC 网络摄像头
- ✅ USB 内窥镜摄像头
- ✅ 工业检测专用摄像头

### Android
- ⏳ 测试进行中

## 常见问题

### Q: 摄像头无法识别怎么办？

**iOS:**
1. 检查系统版本是否为 iOS 17.0 或更高
2. 检查 USB 连接线和转接器
3. 尝试重新插拔摄像头
4. 检查相机权限是否已授予

**Android:**
1. 检查设备是否支持 USB OTG
2. 授予 USB 权限（系统会弹窗询问）
3. 确认摄像头是否符合 UVC 标准
4. 尝试更换 USB 线或转接器

### Q: 视频质量不佳怎么办？

1. 使用 USB 3.0 接口（如果设备支持）
2. 降低分辨率设置
3. 检查 USB 线缆质量
4. 减少帧率设置

### Q: 应用崩溃怎么办？

1. 检查是否已授予 USB 权限
2. 确认摄像头符合 UVC 标准
3. 检查设备的 USB Host 功能
4. 查看应用日志获取具体错误信息

### Q: 支持哪些摄像头？

理论上支持所有符合 UVC 标准的 USB 摄像头，包括：
- 标准 USB 网络摄像头
- 工业相机
- 医疗/内窥镜摄像头
- 显微镜摄像头
- 文档摄像机

## 推荐硬件

### 工业检测推荐

1. **Logitech C920/C930**
   - 1080p 分辨率
   - 自动对焦
   - 性价比高

2. **工业相机**
   - 支持更高分辨率
   - 手动控制选项多
   - 适合专业应用

3. **USB 内窥镜**
   - 特殊镜头设计
   - 适合管道检测
   - LED 补光

## 后续计划

- [ ] 完成 Android USB 摄像头集成
- [ ] 支持多摄像头同时使用
- [ ] 添加更多手动控制选项
- [ ] WiFi/网络摄像头支持
- [ ] 蓝牙摄像头支持

## 技术支持

如遇问题，请提供以下信息：

1. 设备型号和系统版本
2. USB 摄像头型号
3. 错误日志或截图
4. 重现步骤

---

**最后更新:** 2026-04-17
**状态:** 开发中
**计划发布:** v5.1.0
