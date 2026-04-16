import type { StaticScreenProps } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { type Image, NitroImage } from 'react-native-nitro-image'
import type { Photo } from 'react-native-vision-camera'
import { FullOverlay } from '../components/FullOverlay'
import { IconButton } from '../components/IconButton'
import { Row } from '../components/Row'
import { useSafeAreaPadding } from '../hooks/useSafeAreaPadding'

type Props = StaticScreenProps<{
  photo: Photo
}>

export function PhotoScreen({
  route: {
    params: { photo },
  },
}: Props) {
  const navigation = useNavigation()
  const safePadding = useSafeAreaPadding()
  const [image, setImage] = useState<Image>()

  useEffect(() => {
    const load = async () => {
      const i = await photo.toImageAsync()
      setImage(i)
      photo.dispose()
    }
    load()
  }, [photo])

  return (
    <View style={[styles.container, safePadding]}>
      {image != null ? (
        <NitroImage style={styles.image} resizeMode="contain" image={image} />
      ) : (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="white" />
        </View>
      )}

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
  image: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
})
