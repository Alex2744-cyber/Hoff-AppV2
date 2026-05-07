import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { ConfirmModal, InfoModal } from '@/components/tareas';
import { ProfilePhotoFormSection } from '@/components/admin/ProfilePhotoFormSection';

export default function EditarTrabajadorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [trabajador, setTrabajador] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activo, setActivo] = useState(true);
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [showDesactivarConfirm, setShowDesactivarConfirm] = useState(false);
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

  const loadTrabajador = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.getTrabajadorById(Number(id));
      if (response.success && response.data) {
        const data = response.data;
        setTrabajador(data);
        setNombre(data.nombre || '');
        setCargo(data.cargo || '');
        setFechaIngreso(
          typeof data.fecha_ingreso === 'string' ? data.fecha_ingreso.slice(0, 10) : ''
        );
        setDescripcion(data.descripcion || '');
        setContactoEmergencia(data.contacto_emergencia || '');
        setFotoPerfil(data.foto_perfil || '');
        setActivo(data.activo !== undefined ? data.activo : true);
      }
    } catch {
      openInfoModal('Error', 'No se pudo cargar el staff', 'error', () => router.back());
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadTrabajador();
  }, [loadTrabajador]);

  const handleSubmit = async () => {
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
      const trabajadorData = {
        nombre: nombre.trim(),
        cargo: cargo.trim() || null,
        fecha_ingreso: fechaIngreso.trim() || null,
        contacto_emergencia: contactoEmergencia.trim() || null,
        descripcion: descripcion.trim() || null,
        activo: activo,
        foto_perfil: fotoPerfil.trim() || null,
      };

      const response = await api.updateTrabajador(Number(id), trabajadorData);

      if (response.success) {
        openInfoModal('Staff actualizado', 'Los cambios se han guardado correctamente', 'success', () =>
          router.back()
        );
      } else {
        openInfoModal('Error', (response as { error?: string }).error || 'No se pudo actualizar', 'error');
      }
    } catch (error: any) {
      openInfoModal('Error', error.message || 'No se pudo actualizar el staff', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando…</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  if (!trabajador) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Staff no encontrado</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  return (
    <TaskScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="create-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Editar perfil</Text>
          </View>

          <ProfilePhotoFormSection
            variant="embedded"
            displayName={nombre.trim() || trabajador.nombre || '?'}
            fotoUrl={fotoPerfil}
            onFotoUrlChange={setFotoPerfil}
            mediaTipo="trabajador_perfil"
          />

          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor={HoffColors.textMuted}
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Usuario</Text>
          <View style={styles.usuarioContainer}>
            <Text style={styles.usuarioText}>@{trabajador.usuario}</Text>
            <Text style={styles.usuarioHelper}>El usuario no puede ser modificado</Text>
          </View>

          <Text style={styles.label}>Información relevante</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Notas o información relevante del staff (opcional)"
            placeholderTextColor={HoffColors.textMuted}
            multiline
            numberOfLines={4}
            value={descripcion}
            onChangeText={setDescripcion}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Cargo o posición</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Limpieza senior"
            placeholderTextColor={HoffColors.textMuted}
            value={cargo}
            onChangeText={setCargo}
          />

          <Text style={styles.label}>Fecha de ingreso</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={HoffColors.textMuted}
            value={fechaIngreso}
            onChangeText={setFechaIngreso}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contacto de emergencia</Text>
          <Text style={styles.usuarioHelper}>
            Nombre, teléfono o persona a avisar (opcional, máx. 255 caracteres)
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ej: María Pérez — 612 345 678"
            placeholderTextColor={HoffColors.textMuted}
            value={contactoEmergencia}
            onChangeText={setContactoEmergencia}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={255}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.estadoContainer}>
            <Text style={styles.sectionTitle}>Estado del staff</Text>
            <View style={styles.estadoRow}>
              <Text style={styles.estadoLabel}>{activo ? 'Staff activo' : 'Staff desactivado'}</Text>
              <TouchableOpacity
                style={[styles.estadoButton, activo ? styles.estadoButtonActive : styles.estadoButtonInactive]}
                onPress={() => {
                  if (activo) {
                    setShowDesactivarConfirm(true);
                  } else {
                    setActivo(true);
                  }
                }}
              >
                <Text style={[styles.estadoButtonText, !activo && styles.estadoButtonTextInactive]}>
                  {activo ? 'Desactivar' : 'Activar'}
                </Text>
              </TouchableOpacity>
            </View>
            {!activo && (
              <Text style={styles.estadoHelperText}>
                Este miembro del staff está desactivado y no aparecerá en las listas de selección.
              </Text>
            )}
          </View>
        </View>

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
              <Text style={styles.submitButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>

        <ConfirmModal
          visible={showDesactivarConfirm}
          title="¿Desactivar staff?"
          message="Al desactivar este miembro del staff, no podrá iniciar sesión ni ser asignado a nuevas tareas. Podrá ser reactivado más adelante."
          confirmText="Desactivar"
          cancelText="Cancelar"
          destructive
          onCancel={() => setShowDesactivarConfirm(false)}
          onConfirm={() => {
            setActivo(false);
            setShowDesactivarConfirm(false);
          }}
        />
        <InfoModal
          visible={infoModal.visible}
          title={infoModal.title}
          message={infoModal.message}
          variant={infoModal.variant}
          onPrimary={closeInfoModal}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: taskSpacing.md,
    fontSize: 16,
    color: HoffColors.textSecondary,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
    marginBottom: taskSpacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: HoffColors.textSecondary,
    marginTop: taskSpacing.md,
    marginBottom: taskSpacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    color: HoffColors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    color: HoffColors.text,
    minHeight: 100,
  },
  usuarioContainer: {
    backgroundColor: HoffColors.background,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    marginTop: taskSpacing.xs,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  usuarioText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
  },
  usuarioHelper: {
    fontSize: 12,
    color: HoffColors.textMuted,
    marginTop: taskSpacing.xs,
  },
  estadoContainer: {
    marginTop: taskSpacing.sm,
  },
  estadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: taskSpacing.md,
    flexWrap: 'wrap',
    gap: taskSpacing.sm,
  },
  estadoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: HoffColors.text,
    flex: 1,
    minWidth: 120,
  },
  estadoButton: {
    paddingHorizontal: taskSpacing.lg,
    paddingVertical: taskSpacing.sm + 2,
    borderRadius: taskRadius.sm,
  },
  estadoButtonActive: {
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.35)',
  },
  estadoButtonInactive: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderWidth: 1,
    borderColor: HoffColors.primary,
  },
  estadoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
  },
  estadoButtonTextInactive: {
    color: HoffColors.primaryDark,
  },
  estadoHelperText: {
    fontSize: 12,
    color: HoffColors.textMuted,
    marginTop: taskSpacing.sm,
    fontStyle: 'italic',
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
    fontWeight: '600',
    color: HoffColors.white,
  },
});
