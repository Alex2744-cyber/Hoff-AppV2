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
import { useAuth } from '../../contexts/AuthContext';
import { HoffColors } from '../../constants/theme';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo y título */}
          <View style={styles.header}>
            <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.subtitle}>House & Office Cleaning Services</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChangeText={setUsuario}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={HoffColors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Credenciales de prueba */}
          <View style={styles.testCredentials}>
            <Text style={styles.testTitle}>Credenciales de prueba:</Text>
            <Text style={styles.testText}>👤 Trabajador: jperez / worker123</Text>
            <Text style={styles.testText}>👤 Admin: admin / admin123</Text>
          </View>
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
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrap: {
    marginBottom: 16,
  },
  logo: {
    width: 160,
    height: 160,
  },
  subtitle: {
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: HoffColors.surface,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: HoffColors.accent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: HoffColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  testCredentials: {
    backgroundColor: HoffColors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginBottom: 8,
  },
  testText: {
    fontSize: 13,
    color: HoffColors.textMuted,
    marginBottom: 4,
  },
});

