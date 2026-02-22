import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TareasMenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/worker/tareas/lista')}
        >
          <Text style={styles.buttonText}>Ver Tareas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/worker/tareas/completadas')}
        >
          <Text style={styles.buttonText}>Tareas Completadas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSuccess]}
          onPress={() => router.push('/worker/tareas/realizados')}
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
    backgroundColor: '#fff',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#9C27B0',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
});

