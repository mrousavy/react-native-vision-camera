import Ionicons from '@react-native-vector-icons/ionicons'

interface Props {
  size: number
}

export function CameraIcon({ size }: Props) {
  return <Ionicons size={size} name="camera" color="white" />
}
