import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export async function pickFromGallery(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.9,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function pickFromCamera(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.9,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function uriToBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export async function uriToFormData(uri: string): Promise<FormData> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // On web the picker returns a blob:/data: URL. Multer needs a real Blob,
    // not the { uri } shim that React Native's fetch understands on native.
    const blob = await fetch(uri).then((r) => r.blob());
    formData.append('image', blob, 'item.jpg');
  } else {
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'item.jpg',
    } as unknown as Blob);
  }
  return formData;
}
