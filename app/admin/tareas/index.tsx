import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HoffColors } from '@/constants/theme';

export default function TareasMenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/admin/tareas/crear')}
        >
          <Text style={styles.buttonText}>Crear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/admin/tareas/lista')}
        >
          <Text style={styles.buttonText}>Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/admin/tareas/completadas')}
        >
          <Text style={styles.buttonText}>Completadas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSuccess]}
          onPress={() => router.push('/admin/tareas/realizados')}
        >
          <Text style={styles.buttonText}>Trabajos Realizados</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.surface,
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: HoffColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: HoffColors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: HoffColors.accent,
  },
  buttonSuccess: {
    backgroundColor: HoffColors.primary,
  },
});

