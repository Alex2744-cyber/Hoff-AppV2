import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api, { User } from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { ProfilePhotoFormSection } from '@/components/admin/ProfilePhotoFormSection';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  mediaTipo: 'admin_perfil' | 'trabajador_perfil';
};

export function ProfileEditorSection({ mediaTipo }: Props) {
  const { user, applySessionUser } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre || '');
      setDescripcion(user.descripcion ?? '');
      setFotoUrl(user.foto_perfil || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateAuthMe({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        foto_perfil: fotoUrl.trim() || null,
      });
      if (res.success && res.data) {
        await applySessionUser(res.data as User);
        router.back();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar el perfil';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeading}>Editar perfil</Text>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput
        style={styles.input}
        placeholder="Tu nombre"
        placeholderTextColor={HoffColors.textMuted}
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Breve descripción o notas sobre ti"
        placeholderTextColor={HoffColors.textMuted}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.hintMuted}>
        El nombre de usuario (@{user.usuario}) no se puede cambiar desde la app.
      </Text>

      <ProfilePhotoFormSection
        variant="embedded"
        displayName={nombre.trim() || user.nombre || '?'}
        fotoUrl={fotoUrl}
        onFotoUrlChange={setFotoUrl}
        mediaTipo={mediaTipo}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={HoffColors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginBottom: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: HoffColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: taskSpacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: taskSpacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    color: HoffColors.text,
    backgroundColor: HoffColors.surface,
    marginBottom: taskSpacing.md,
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
    marginBottom: taskSpacing.sm,
  },
  hintMuted: {
    fontSize: 12,
    color: HoffColors.textMuted,
    marginBottom: taskSpacing.md,
    lineHeight: 18,
  },
  saveButton: {
    marginTop: taskSpacing.md,
    backgroundColor: HoffColors.primary,
    paddingVertical: taskSpacing.md,
    borderRadius: taskRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
