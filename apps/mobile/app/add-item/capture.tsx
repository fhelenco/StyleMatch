import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { pickFromCamera, pickFromGallery, uriToFormData } from '../../lib/imageUtils';
import { apiUpload } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export default function CaptureScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCamera = async () => {
    const uri = await pickFromCamera();
    if (uri) setImageUri(uri);
  };

  const handleGallery = async () => {
    const uri = await pickFromGallery();
    if (uri) setImageUri(uri);
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const formData = await uriToFormData(imageUri);
      const result = await apiUpload('/api/wardrobe/analyze', formData);
      router.push({
        pathname: '/add-item/confirm',
        params: { data: JSON.stringify(result), imageUri },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Item</Text>
        <View style={{ width: 40 }} />
      </View>

      {imageUri ? (
        <View style={styles.preview}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          <View style={styles.actions}>
            <Button title="Choose Different" onPress={() => setImageUri(null)} variant="secondary" />
            <Button title="Analyze with AI" onPress={handleAnalyze} loading={loading} />
          </View>
        </View>
      ) : (
        <View style={styles.picker}>
          <Text style={styles.subtitle}>Add a clothing item to your wardrobe</Text>
          <TouchableOpacity onPress={handleCamera} style={styles.optionCard} activeOpacity={0.8}>
            <Ionicons name="camera" size={36} color={colors.accent} />
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionSub}>Use your camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGallery} style={styles.optionCard} activeOpacity={0.8}>
            <Ionicons name="images" size={36} color={colors.accent} />
            <Text style={styles.optionTitle}>Choose from Gallery</Text>
            <Text style={styles.optionSub}>Pick an existing photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Analyzing with Claude AI…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '600', color: c.foreground },
    picker: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
    subtitle: { fontSize: 15, color: c.muted, textAlign: 'center', marginBottom: 8 },
    optionCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    optionTitle: { fontSize: 16, fontWeight: '600', color: c.foreground },
    optionSub: { fontSize: 13, color: c.muted },
    preview: { flex: 1, gap: 16, padding: 16 },
    image: { flex: 1, borderRadius: 16, backgroundColor: c.surfaceAlt },
    actions: { gap: 10 },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    loadingText: { fontSize: 15, color: c.muted },
  });
