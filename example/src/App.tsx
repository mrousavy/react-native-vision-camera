import * as React from 'react';

import { BarcodeFormat, scanBarcodes } from 'vision-camera-code-scanner';
import { Camera, useFrameProcessor } from 'react-native-vision-camera';
import { Canvas, Points, vec } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';

import { runOnJS } from 'react-native-reanimated';
import { useCameraDevices } from 'react-native-vision-camera';

export function App() {
  const [hasPermission, setHasPermission] = React.useState(false);
  const devices = useCameraDevices();
  const device = devices.back;

  const [barcodes, setBarcodes] = React.useState<BarcodeFormat[]>([]); // [BarcodeFormat.QR_CODE

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.ALL_FORMATS], { checkInverted: true });
    // console.log(new Date(), JSON.stringify(detectedBarcodes));
    runOnJS(setBarcodes)(detectedBarcodes);
  }, []);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const X_SCALE = 390 / 1080;
  const Y_SCALE = 824 / 1920;

  return (
    device != null &&
    hasPermission && (
      <>
        <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} frameProcessor={frameProcessor} frameProcessorFps={30} />
        <Canvas style={{ flex: 1 }}>
          {barcodes.map((barcode, idx) => {
            const points = barcode.cornerPoints
              .filter((point) => !isNaN(point.x) && !isNaN(point.y))
              .map((point) => vec(point.x * X_SCALE, point.y * Y_SCALE));
            points.push(points[0]);
            return <Points key={idx} points={points} mode="polygon" color="lime" strokeWidth={5} strokeCap="square" />;
          })}
        </Canvas>
        {barcodes.map((barcode, idx) => {
          const x = barcode.cornerPoints[0].x;
          const y = barcode.cornerPoints[0].y;
          if (isNaN(x) || isNaN(y)) {
            return <View />;
          }
          return (
            <Text
              key={idx}
              style={{
                position: 'absolute',
                textAlign: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                left: x * X_SCALE,
                top: y * Y_SCALE,
                color: 'white',
                fontWeight: 'bold',
                fontSize: 20,
              }}>
              {barcode.displayValue}
            </Text>
          );
        })}
      </>
    )
  );
}

const styles = StyleSheet.create({
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});
