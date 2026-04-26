import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Cierra sesión con confirmación. En web usa `window.confirm` porque `Alert.alert`
 * no es fiable en React Native Web.
 */
export function useLogoutWithConfirm() {
  const router = useRouter();
  const { logout } = useAuth();

  return useCallback(() => {
    const exec = async () => {
      try {
        await logout();
      } finally {
        router.replace('/auth/login');
      }
    };

    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (ok) void exec();
      return;
    }

    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => void exec(),
      },
    ]);
  }, [logout, router]);
}
