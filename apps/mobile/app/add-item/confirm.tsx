import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { ColorSwatch } from '../../components/ui/ColorSwatch';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { useQueryClient } from '@tanstack/react-query';

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{ data: string; imageUri: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const addItem = useWardrobeStore((s) => s.addItem);

  const initial = params.data ? JSON.parse(params.data) : {};
  const [label, setLabel] = useState(initial.label || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Label required', 'Please give this item a name.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: label.trim(),
        garment_type: initial.garment_type,
        category: initial.category,
        style_category: initial.style_category,
        pattern: initial.pattern,
        fabric: initial.fabric,
        season: initial.season,
        colors: initial.colors,
        image_url: initial.image_url,
        image_path: initial.image_path,
        notes: notes.trim() || undefined,
      };
      const saved = await apiRequest('/api/wardrobe', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      addItem(saved as Parameters<typeof addItem>[0]);
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      router.replace('/add-item/success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Review Item</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {params.imageUri && (
          <Image
            source={{ uri: params.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Item name"
            placeholderTextColor="#8C8C8C"
          />
        </View>

        {initial.colors?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Colors</Text>
            <View style={styles.colorRow}>
              <ColorSwatch colors={initial.colors} size={24} />
              <Text style={styles.colorNames}>
                {initial.colors.map((c: { name: string }) => c.name).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {[
          ['Category', initial.category],
          ['Type', initial.garment_type],
          ['Style', initial.style_category],
          ['Pattern', initial.pattern],
          ['Fabric', initial.fabric],
          ['Season', initial.season],
        ].filter(([, v]) => v).map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.rowKey}>{k}</Text>
            <Text style={styles.rowVal}>{v}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this piece…"
            placeholderTextColor="#8C8C8C"
            multiline
            numberOfLines={3}
          />
        </View>

        <Button title="Save to Wardrobe" onPress={handleSave} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  image: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: '#F5F0ED' },
  section: { gap: 8 },
  sectionLabel: { fontSize: 12, color: '#8C8C8C', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E2DE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorNames: { fontSize: 14, color: '#1A1A1A', textTransform: 'capitalize', flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E8E2DE',
  },
  rowKey: { fontSize: 14, color: '#8C8C8C' },
  rowVal: { fontSize: 14, color: '#1A1A1A', fontWeight: '500', textTransform: 'capitalize' },
});
