import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'login' | 'register';

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();

  const handleContinue = async () => {
    if (!email || !password) return;

    if (tab === 'register') {
      if (password.length < 8) {
        Alert.alert('Password too short', 'Use at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Passwords do not match', 'Please check and try again.');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email.trim().toLowerCase(), password);
      } else {
        await signUp(email.trim().toLowerCase(), password);
        Alert.alert(
          'Account created',
          'Check your email to confirm your account, then sign in.',
          [{ text: 'OK', onPress: () => { setTab('login'); setPassword(''); setConfirmPassword(''); } }]
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert(tab === 'login' ? 'Sign In Error' : 'Sign Up Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.wordmark}>StyleMatch</Text>
        <Text style={styles.tagline}>Your wardrobe, elevated.</Text>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
            onPress={() => setTab('login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
            onPress={() => setTab('register')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, tab === 'register' && styles.tabLabelActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Form fields */}
        <View style={styles.form}>
          {tab === 'register' && (
            <TextInput
              style={inputStyle}
              placeholder="Full Name"
              placeholderTextColor="#8C8C8C"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={inputStyle}
            placeholder="Email"
            placeholderTextColor="#8C8C8C"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            placeholderTextColor="#8C8C8C"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {tab === 'register' && (
            <TextInput
              style={inputStyle}
              placeholder="Confirm Password"
              placeholderTextColor="#8C8C8C"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity
            style={[styles.ctaButton, (loading || !email || !password) && styles.ctaDisabled]}
            onPress={handleContinue}
            disabled={loading || !email || !password}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {loading ? (tab === 'login' ? 'Signing in…' : 'Creating account…') : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
            <Text style={styles.socialLabel}>Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
            <Text style={styles.socialLabel}>Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60, paddingBottom: 40, gap: 0 },
  wordmark: { fontSize: 36, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  tagline: { fontSize: 15, color: '#8C8C8C', textAlign: 'center', marginTop: 8, marginBottom: 32 },

  tabRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  tabBtn: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#1A1A1A' },
  tabLabel: { fontSize: 15, fontWeight: '600', color: '#8C8C8C' },
  tabLabelActive: { color: '#1A1A1A' },

  form: { gap: 12 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E2DE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  ctaButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E2DE' },
  dividerText: { fontSize: 12, color: '#8C8C8C' },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E8E2DE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  socialLabel: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },

  legal: {
    fontSize: 11,
    color: '#8C8C8C',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
