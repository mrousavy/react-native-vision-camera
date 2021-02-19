import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { Navigation, NavigationFunctionComponent } from 'react-native-navigation';
import Video from 'react-native-video';
import { CONTENT_SPACING } from './Constants';
import { useIsForeground } from './hooks/useIsForeground';
import { useIsScreenFocused } from './hooks/useIsScreenFocused';

interface MediaProps {
  path: string,
  type: 'video' | 'photo'
}

export const Media: NavigationFunctionComponent<MediaProps> = ({ componentId, type, path }) => {
  const isForeground = useIsForeground();
  const isScreenFocused = useIsScreenFocused(componentId);
  const isVideoPaused = !isForeground || !isScreenFocused;

  const onClosePressed = useCallback(() => {
    Navigation.dismissModal(componentId);
  }, [componentId]);

  const source = useMemo(() => ({ uri: `file://${path}` }), [path])

  return (
    <View style={styles.container}>
      {type === "photo" && (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover" />
      )}
      {type === "video" && (
        <Video source={source}
          style={StyleSheet.absoluteFill}
          paused={isVideoPaused}
          resizeMode="cover"
          posterResizeMode="cover"
          allowsExternalPlayback={false}
          automaticallyWaitsToMinimizeStalling={false}
          disableFocus={true}
          repeat={true}
          useTextureView={false}
          controls={false}
          playWhenInactive={true}
          ignoreSilentSwitch="ignore" />
      )}

      <Pressable style={styles.closeButton} onPress={onClosePressed}><Text>Close.</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: CONTENT_SPACING,
    left: CONTENT_SPACING,
    width: 40,
    height: 40,
  },
});
