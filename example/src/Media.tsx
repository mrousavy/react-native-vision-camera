import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { Navigation, NavigationFunctionComponent, OptionsModalPresentationStyle } from 'react-native-navigation';
import Video from 'react-native-video';
import { SAFE_AREA_PADDING } from './Constants';
import { useIsForeground } from './hooks/useIsForeground';
import { useIsScreenFocused } from './hooks/useIsScreenFocused';
import { PressableOpacity } from './views/PressableOpacity';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Alert } from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground';

interface MediaProps {
  path: string;
  type: 'video' | 'photo';
}

const requestSavePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  let hasPermission = await PermissionsAndroid.check(permission);
  if (!hasPermission) {
    const permissionRequestResult = await PermissionsAndroid.request(permission);
    hasPermission = permissionRequestResult === 'granted';
  }
  return hasPermission;
};

export const Media: NavigationFunctionComponent<MediaProps> = ({ componentId, type, path }) => {
  const [hasMediaLoaded, setHasMediaLoaded] = useState(false);
  const isForeground = useIsForeground();
  const isScreenFocused = useIsScreenFocused(componentId);
  const isVideoPaused = !isForeground || !isScreenFocused;
  const [savingState, setSavingState] = useState<'none' | 'saving' | 'saved'>('none');

  const onClosePressed = useCallback(() => {
    Navigation.dismissModal(componentId);
  }, [componentId]);

  const onMediaLoadEnd = useCallback(() => {
    console.log('media has loaded.');
    setHasMediaLoaded(true);
  }, []);

  const onSavePressed = useCallback(async () => {
    try {
      setSavingState('saving');

      const hasPermission = await requestSavePermission();
      if (!hasPermission) {
        Alert.alert('Permission denied!', 'Vision Camera does not have permission to save the media to your camera roll.');
        return;
      }
      await CameraRoll.save(`file://${path}`, {
        type: type,
      });
      setSavingState('saved');
    } catch (e) {
      setSavingState('none');
      Alert.alert('Failed to save!', `An unexpected error occured while trying to save your ${type}. ${e?.message ?? JSON.stringify(e)}`);
    }
  }, [path, type]);

  const source = useMemo(() => ({ uri: `file://${path}` }), [path]);

  const screenStyle = useMemo(() => ({ opacity: hasMediaLoaded ? 1 : 0 }), [hasMediaLoaded]);

  return (
    <View style={[styles.container, screenStyle]}>
      {type === 'photo' && <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" onLoadEnd={onMediaLoadEnd} />}
      {type === 'video' && (
        <Video
          source={source}
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
          ignoreSilentSwitch="ignore"
          onReadyForDisplay={onMediaLoadEnd}
        />
      )}

      <PressableOpacity style={styles.closeButton} onPress={onClosePressed}>
        <IonIcon name="close" size={35} color="white" style={styles.icon} />
      </PressableOpacity>

      <PressableOpacity style={styles.saveButton} onPress={onSavePressed} disabled={savingState !== 'none'}>
        {savingState === 'none' && <IonIcon name="download" size={35} color="white" style={styles.icon} />}
        {savingState === 'saved' && <IonIcon name="checkmark" size={35} color="white" style={styles.icon} />}
        {savingState === 'saving' && <ActivityIndicator color="white" />}
      </PressableOpacity>

      <StatusBarBlurBackground />
    </View>
  );
};

Media.options = {
  modal: {
    swipeToDismiss: false,
  },
  modalPresentationStyle: OptionsModalPresentationStyle.overCurrentContext,
  animations: {
    showModal: {
      waitForRender: true,
      enabled: false,
    },
    dismissModal: {
      enabled: false,
    },
  },
  layout: {
    backgroundColor: 'transparent',
    componentBackgroundColor: 'transparent',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: SAFE_AREA_PADDING.paddingTop,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
  },
  saveButton: {
    position: 'absolute',
    bottom: SAFE_AREA_PADDING.paddingBottom,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
  },
  icon: {
    textShadowColor: 'black',
    textShadowOffset: {
      height: 0,
      width: 0,
    },
    textShadowRadius: 1,
  },
});
