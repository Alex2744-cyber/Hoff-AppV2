import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { HoffColors } from '@/constants/theme';
import { taskContentMaxWidth, taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);
  const insets = useSafeAreaInsets();

  const { login } = useAuth();

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [logoOpacity, logoScale]);

  const handleLogin = async () => {
    if (!usuario || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const success = await login(usuario, password);

      if (success) {
        // _layout.tsx redirige según user.tipo a /admin/dashboard o /worker/dashboard
      } else {
        Alert.alert('Error', 'Credenciales incorrectas');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + taskSpacing.xl }]}>
          <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.heroSubtitle}>House & Office Cleaning Services</Text>
        </View>

        <View style={styles.column}>
          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Usuario</Text>
              <View style={styles.inputShell}>
                <Ionicons name="person-outline" size={20} color={HoffColors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor={HoffColors.textMuted}
                  value={usuario}
                  onChangeText={setUsuario}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputShell}>
                <Ionicons name="lock-closed-outline" size={20} color={HoffColors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={HoffColors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={HoffColors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {__DEV__ ? (
            <View style={styles.devCard}>
              <View style={styles.devHeader}>
                <Ionicons name="information-circle-outline" size={18} color={HoffColors.textSecondary} />
                <Text style={styles.devTitle}>Credenciales de prueba</Text>
              </View>
              <View style={styles.devLine}>
                <Ionicons name="briefcase-outline" size={16} color={HoffColors.textMuted} />
                <Text style={styles.devText}>Trabajador: jperez / worker123</Text>
              </View>
              <View style={styles.devLine}>
                <Ionicons name="shield-outline" size={16} color={HoffColors.textMuted} />
                <Text style={styles.devText}>Admin: admin / admin123</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: taskSpacing.xxl,
  },
  hero: {
    backgroundColor: HoffColors.primary,
    paddingBottom: taskSpacing.xxl,
    paddingHorizontal: taskSpacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: taskRadius.lg,
    borderBottomRightRadius: taskRadius.lg,
  },
  logoWrap: {
    marginBottom: taskSpacing.md,
  },
  logo: {
    width: 140,
    height: 140,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
    fontWeight: '500',
  },
  column: {
    maxWidth: taskContentMaxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: taskSpacing.lg,
    marginTop: -taskSpacing.lg,
  },
  formCard: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  field: {
    marginBottom: taskSpacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: taskSpacing.sm,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
    backgroundColor: HoffColors.surface,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    paddingHorizontal: taskSpacing.md,
    paddingVertical: Platform.OS === 'ios' ? taskSpacing.md : taskSpacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: HoffColors.text,
    paddingVertical: Platform.OS === 'android' ? 4 : 0,
    minHeight: 24,
  },
  loginButton: {
    backgroundColor: HoffColors.primary,
    borderRadius: taskRadius.lg,
    paddingVertical: taskSpacing.lg,
    alignItems: 'center',
    marginTop: taskSpacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: HoffColors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  devCard: {
    marginTop: taskSpacing.lg,
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.md,
    padding: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
    marginBottom: taskSpacing.sm,
  },
  devTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  devLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
    marginTop: taskSpacing.xs,
  },
  devText: {
    fontSize: 13,
    color: HoffColors.textMuted,
    flex: 1,
  },
});
