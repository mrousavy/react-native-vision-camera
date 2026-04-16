import type { StaticScreenProps } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, View } from 'react-native'
import { Video } from 'react-native-video'
import { FullOverlay } from '../components/FullOverlay'
import { IconButton } from '../components/IconButton'
import { Row } from '../components/Row'
import { useSafeAreaPadding } from '../hooks/useSafeAreaPadding'

type Props = StaticScreenProps<{
  videoURL: string
}>

export function VideoScreen({
  route: {
    params: { videoURL },
  },
}: Props) {
  const navigation = useNavigation()
  const safePadding = useSafeAreaPadding()

  console.log(`Video URL:`, videoURL)

  return (
    <View style={[styles.container, safePadding]}>
      <Video
        style={styles.video}
        source={{ uri: videoURL }}
        repeat={true}
        controls={false}
      />

      <FullOverlay style={safePadding}>
        <Row>
          <View style={styles.flex} />
          <IconButton iconName="close" onPress={() => navigation.goBack()} />
        </Row>
      </FullOverlay>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
})
