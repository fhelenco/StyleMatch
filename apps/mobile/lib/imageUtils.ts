import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// NB: `allowsEditing` is deliberately off. On iOS the built-in editor forces a
// 1:1 square crop (the `aspect` prop is Android-only), which chops the top and
// bottom off full-length garment photos. We keep the whole frame — the backend
// removes the background and flattens it onto an off-white backdrop anyway.
export async function pickFromGallery(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function pickFromCamera(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
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
