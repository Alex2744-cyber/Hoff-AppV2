import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { ProfilePhotoFormSection } from '@/components/admin/ProfilePhotoFormSection';

export default function CrearTrabajadorScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!usuario.trim()) {
      Alert.alert('Error', 'El usuario es requerido');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'La contraseña es requerida');
      return;
    }
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const response = await api.createTrabajador({
        usuario: usuario.trim(),
        password: password,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        foto_perfil: fotoPerfil.trim() || null,
      });

      if (response.success) {
        Alert.alert(
          'Trabajador creado',
          'El trabajador se ha registrado correctamente.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', response.error || 'No se pudo crear el trabajador');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el trabajador');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskScreenContainer>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.label}>Usuario *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario para iniciar sesión"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Contraseña *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña inicial"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre completo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre y apellidos"
          value={nombre}
          onChangeText={setNombre}
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Notas internas sobre el trabajador..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      <ProfilePhotoFormSection
        displayName={nombre}
        fotoUrl={fotoPerfil}
        onFotoUrlChange={setFotoPerfil}
        mediaTipo="trabajador_perfil"
      />

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={HoffColors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Crear trabajador</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  content: {
    paddingBottom: taskSpacing.xxl,
  },
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginBottom: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: taskSpacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    color: HoffColors.text,
    backgroundColor: HoffColors.surface,
  },
  textArea: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    color: HoffColors.text,
    minHeight: 100,
    backgroundColor: HoffColors.surface,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: taskSpacing.md,
    marginTop: taskSpacing.sm,
    marginBottom: taskSpacing.xxl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: taskSpacing.lg,
    borderRadius: taskRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  submitButton: {
    flex: 1,
    backgroundColor: HoffColors.primary,
    padding: taskSpacing.lg,
    borderRadius: taskRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
});
