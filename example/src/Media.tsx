import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { Navigation, NavigationFunctionComponent } from 'react-native-navigation';
import Video from 'react-native-video';
import { CONTENT_SPACING } from './Constants';

interface MediaProps {
  path: string,
  type: 'video' | 'photo'
}

export const Media: NavigationFunctionComponent<MediaProps> = ({ componentId, type, path }) => {
  const onClosePressed = useCallback(() => {
    Navigation.dismissModal(componentId);
  }, [componentId]);

  const source = useMemo(() => ({ uri: `file://${path}` }), [path])

  return (
    <View style={styles.container}>
      {type === "photo" && (<Image source={source} style={StyleSheet.absoluteFill} />)}
      {type === "video" && (<Video source={source} style={StyleSheet.absoluteFill} />)}

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
