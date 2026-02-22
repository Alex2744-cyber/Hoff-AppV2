import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NavigationLoadingProvider } from '@/contexts/NavigationLoadingContext';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { NavigationLoadingTrigger } from '@/components/NavigationLoadingTrigger';

export const unstable_settings = {
  initialRouteName: 'auth/login',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inAdminGroup = segments[0] === 'admin';
    const inWorkerGroup = segments[0] === 'worker';

    if (!user && !inAuthGroup) {
      // Usuario no autenticado, redirigir a login
      router.replace('/auth/login');
    } else if (user) {
      // Usuario autenticado
      if (inAuthGroup) {
        // Si está en pantalla de login, redirigir a dashboard según tipo
        if (user.tipo === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/worker/dashboard');
        }
      } else if (user.tipo === 'admin' && !inAdminGroup) {
        // Admin intentando acceder a área de trabajador
        router.replace('/admin/dashboard');
      } else if (user.tipo === 'trabajador' && !inWorkerGroup) {
        // Trabajador intentando acceder a área de admin
        router.replace('/worker/dashboard');
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return null;
  }

  return (
    <NavigationLoadingProvider>
      <NavigationLoadingTrigger />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="worker" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <LoadingOverlay />
        </View>
      </ThemeProvider>
      <StatusBar style="light" />
    </NavigationLoadingProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
