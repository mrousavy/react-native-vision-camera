import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Linking } from 'react-native';
import { Navigation, NavigationFunctionComponent } from 'react-native-navigation';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { useEffect } from 'react';
import { Camera } from 'react-native-vision-camera';
import { SAFE_AREA_PADDING } from './Constants';
import { useSelector } from 'pipestate';
import { FpsSelector } from './state/selectors';

export const Settings: NavigationFunctionComponent = ({ componentId }) => {
  const [fpsSelector, setFpsSelector] = useSelector(FpsSelector);
  const [fps, setFps] = useState(fpsSelector);

  const [minFps, setMinFps] = useState<number>();
  const [maxFps, setMaxFps] = useState<number>();

  const onCuventPressed = useCallback(() => {
    Linking.openURL('https://cuvent.com');
  }, []);

  useEffect(() => {
    const loadFormats = async (): Promise<void> => {
      const devices = await Camera.getAvailableCameraDevices();
      const formats = devices.flatMap((d) => d.formats);
      let max = 0,
        min = 0;
      formats.forEach((format) => {
        const frameRates = format.frameRateRanges.map((f) => f.maxFrameRate).sort((left, right) => left - right);
        const highest = frameRates[frameRates.length - 1] as number;
        const lowest = frameRates[0] as number;
        if (highest > max) max = highest;
        if (lowest < min) min = lowest;
      });
      setMaxFps(max);
      setMinFps(min);
    };
    loadFormats();
  }, []);

  useEffect(() => {
    const listener = Navigation.events().registerScreenPoppedListener((event) => {
      if (event.componentId === componentId) setFpsSelector(fps);
    });
    return () => {
      listener.remove();
    };
  }, [componentId, fps, setFpsSelector]);

  return (
    <View style={styles.container}>
      <View style={styles.vControl}>
        <Text>Frame Rate (FPS): {fps}</Text>
        {minFps != null && maxFps != null && <Slider minimumValue={minFps} maximumValue={maxFps} value={fps} onValueChange={setFps} />}
      </View>

      <View style={styles.spacer} />

      <Text style={styles.aboutText}>
        Vision Camera is powered by{' '}
        <Text style={styles.hyperlink} onPress={onCuventPressed}>
          Cuvent
        </Text>
        .
      </Text>
    </View>
  );
};

Settings.options = {
  topBar: {
    visible: true,
    title: {
      text: 'Settings',
    },
    backButton: {
      id: 'back',
      showTitle: true,
    },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'white',
    ...SAFE_AREA_PADDING,
  },
  aboutText: {
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A9A9A9',
    maxWidth: '50%',
    textAlign: 'center',
  },
  hyperlink: {
    color: '#007aff',
    fontWeight: 'bold',
  },
  vControl: {
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
});
