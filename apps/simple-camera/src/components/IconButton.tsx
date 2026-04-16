import Ionicons, {
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons'
import type React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { BlurContainer, type BlurContainerProps } from './BlurContainer'

interface Props extends BlurContainerProps {
  iconName: IoniconsIconName
  onPress: () => void
}

export function IconButton({
  iconName,
  children,
  onPress,
  ...props
}: Props): React.ReactElement {
  return (
    <Pressable onPress={onPress} {...props}>
      <BlurContainer style={styles.container}>
        {children}
        <Ionicons size={24} name={iconName} color="white" />
      </BlurContainer>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    overflow: 'hidden',
    padding: 10,
  },
})
