import React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import type { NavigationFunctionComponent } from 'react-native-navigation';

export const Settings: NavigationFunctionComponent = ({ componentId }) => {
  return (
    <View style={styles.container}>
      <Text>powered by Cuvent</Text>
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
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
