import React, { useCallback } from 'react';

import { StyleSheet, View, Text, Linking } from 'react-native';
import type { NavigationFunctionComponent } from 'react-native-navigation';


export const Settings: NavigationFunctionComponent = () => {
  const onCuventPressed = useCallback(() => {
    Linking.openURL('https://cuvent.com')
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.aboutText}>Vision Camera is powered by{" "}
        <Text style={styles.hyperlink} onPress={onCuventPressed}>Cuvent</Text>.
      </Text>
    </View>
  );
}

Settings.options = {
  topBar: {
    visible: true,
    title: {
      text: 'Settings'
    },
    backButton: {
      id: 'back',
      showTitle: true,
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  aboutText: {
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
});
