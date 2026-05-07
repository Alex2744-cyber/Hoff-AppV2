import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { InfoModal } from '@/components/tareas';
import { ProfilePhotoFormSection } from '@/components/admin/ProfilePhotoFormSection';

export default function CrearTrabajadorScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [saving, setSaving] = useState(false);
  const [infoModal, setInfoModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const openInfoModal = (
    title: string,
    message: string,
    variant: 'info' | 'success' | 'warning' | 'error' = 'info',
    onClose?: () => void
  ) => setInfoModal({ visible: true, title, message, variant, onClose });

  const closeInfoModal = () => {
    const cb = infoModal.onClose;
    setInfoModal((prev) => ({ ...prev, visible: false, onClose: undefined }));
    if (cb) cb();
  };

  const handleSubmit = async () => {
    if (!usuario.trim()) {
      openInfoModal('Error', 'El usuario es requerido', 'error');
      return;
    }
    if (!password.trim()) {
      openInfoModal('Error', 'La contraseña es requerida', 'error');
      return;
    }
    if (!nombre.trim()) {
      openInfoModal('Error', 'El nombre es requerido', 'error');
      return;
    }
    if (fechaIngreso.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(fechaIngreso.trim())) {
      openInfoModal('Error', 'La fecha de ingreso debe tener formato YYYY-MM-DD', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await api.createTrabajador({
        usuario: usuario.trim(),
        password: password,
        nombre: nombre.trim(),
        cargo: cargo.trim() || null,
        fecha_ingreso: fechaIngreso.trim() || null,
        contacto_emergencia: contactoEmergencia.trim() || null,
        descripcion: descripcion.trim() || null,
        foto_perfil: fotoPerfil.trim() || null,
      });

      if (response.success) {
        openInfoModal(
          'Staff creado',
          'El miembro del staff se ha registrado correctamente.',
          'success',
          () => router.back()
        );
      } else {
        openInfoModal('Error', response.error || 'No se pudo crear el staff', 'error');
      }
    } catch (error: any) {
      openInfoModal('Error', error.message || 'No se pudo crear el staff', 'error');
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
        <Text style={styles.label}>Cargo o posición (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Limpieza senior"
          value={cargo}
          onChangeText={setCargo}
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Fecha de ingreso (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={fechaIngreso}
          onChangeText={setFechaIngreso}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Contacto de emergencia (opcional)</Text>
        <Text style={styles.fieldHint}>Nombre, teléfono o persona a avisar (máx. 255 caracteres)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Ej: María Pérez — 612 345 678"
          value={contactoEmergencia}
          onChangeText={setContactoEmergencia}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={255}
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Información relevante (opcional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Notas o información relevante sobre el staff..."
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
            <Text style={styles.submitButtonText}>Crear staff</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    <InfoModal
      visible={infoModal.visible}
      title={infoModal.title}
      message={infoModal.message}
      variant={infoModal.variant}
      onPrimary={closeInfoModal}
    />
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
  fieldHint: {
    fontSize: 12,
    color: HoffColors.textMuted,
    marginTop: -taskSpacing.xs,
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
