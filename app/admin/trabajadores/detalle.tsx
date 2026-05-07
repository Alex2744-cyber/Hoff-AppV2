import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { InfoModal } from '@/components/tareas';
import { ClienteAvatar } from '@/components/clientes/ClienteAvatar';

function formatFechaIngreso(fecha: string | null | undefined): string {
  if (!fecha || typeof fecha !== 'string') return 'Sin fecha';
  const d = fecha.slice(0, 10);
  return d || 'Sin fecha';
}

export default function DetalleTrabajadorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [trabajador, setTrabajador] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCredencialesModal, setShowCredencialesModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
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

  const closeCredencialesModal = () => {
    if (resettingPassword) return;
    setShowCredencialesModal(false);
    setAdminPassword('');
    setNewWorkerPassword('');
  };

  const loadTrabajador = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.getTrabajadorById(Number(id));
      if (response.success && response.data) {
        setTrabajador(response.data);
      } else {
        setTrabajador(null);
      }
    } catch {
      openInfoModal('Error', 'No se pudo cargar el staff', 'error', () => router.back());
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadTrabajador();
    }, [loadTrabajador])
  );

  const handleResetPassword = async () => {
    if (!adminPassword.trim()) {
      openInfoModal('Error', 'Debes ingresar tu contraseña de administrador', 'error');
      return;
    }
    if (!newWorkerPassword.trim()) {
      openInfoModal('Error', 'Debes ingresar la nueva contraseña del staff', 'error');
      return;
    }
    if (newWorkerPassword.trim().length < 6) {
      openInfoModal('Error', 'La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      setResettingPassword(true);
      const response = await api.resetTrabajadorPassword(Number(id), {
        admin_password: adminPassword,
        new_password: newWorkerPassword,
      });
      if (response.success) {
        const plain = newWorkerPassword;
        closeCredencialesModal();
        openInfoModal(
          'Contraseña restablecida',
          `La nueva contraseña temporal es: ${plain}\n\nCompártela con el staff por un canal seguro y pídele cambiarla al iniciar sesión.`,
          'success'
        );
      } else {
        openInfoModal(
          'Error',
          (response as { error?: string }).error || 'No se pudo restablecer la contraseña',
          'error'
        );
      }
    } catch (error: any) {
      openInfoModal(
        'Error',
        error?.message || 'No se pudo restablecer la contraseña del staff',
        'error'
      );
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando staff...</Text>
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

  const activo = trabajador.activo !== false;

  return (
    <TaskScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Información del perfil</Text>
          </View>

          <View style={styles.avatarBlock}>
            <ClienteAvatar
              nombre={trabajador.nombre || '?'}
              fotoUri={trabajador.foto_perfil || undefined}
              size={88}
            />
            <View style={styles.avatarMeta}>
              <Text style={styles.displayName}>{trabajador.nombre}</Text>
              <View style={[styles.estadoBadge, activo ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
                <Text style={[styles.estadoBadgeText, !activo && styles.estadoBadgeTextInactivo]}>
                  {activo ? 'Activo' : 'Desactivado'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Usuario</Text>
            <Text style={styles.value}>@{trabajador.usuario}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Cargo o posición</Text>
            <Text style={styles.value}>{trabajador.cargo?.trim() ? trabajador.cargo : '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha de ingreso</Text>
            <Text style={styles.value}>{formatFechaIngreso(trabajador.fecha_ingreso)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Contacto de emergencia</Text>
            <Text style={styles.valueMultiline}>
              {trabajador.contacto_emergencia?.trim()
                ? trabajador.contacto_emergencia
                : 'Sin datos'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Información relevante</Text>
            <Text style={styles.valueMultiline}>
              {trabajador.descripcion?.trim() ? trabajador.descripcion : 'Sin información relevante'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha de registro</Text>
            <Text style={styles.value}>
              {new Date(trabajador.fecha_creacion || Date.now()).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editarPerfilButton}
            onPress={() => router.push(`/admin/trabajadores/editar?id=${id}`)}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil del staff"
          >
            <Ionicons name="create-outline" size={20} color={HoffColors.white} style={styles.buttonIcon} />
            <Text style={styles.editarPerfilButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bar-chart-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Estadísticas</Text>
          </View>
          <Text style={styles.helperText}>
            Ver estadísticas detalladas del staff, incluyendo tareas aprobadas y horas trabajadas por período
          </Text>
          <TouchableOpacity
            style={styles.estadisticasButton}
            onPress={() =>
              router.push(
                `/admin/trabajadores/estadisticas?id=${id}&nombre=${encodeURIComponent(trabajador.nombre)}`
              )
            }
          >
            <Ionicons name="stats-chart-outline" size={18} color={HoffColors.white} style={styles.buttonIcon} />
            <Text style={styles.estadisticasButtonText}>Ver estadísticas detalladas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="lock-closed-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Credenciales de acceso</Text>
          </View>
          <Text style={styles.helperText}>
            Restablecer contraseña del staff con reautenticación de administrador
          </Text>
          <TouchableOpacity style={styles.credencialesButton} onPress={() => setShowCredencialesModal(true)}>
            <Ionicons name="eye-outline" size={18} color={HoffColors.white} style={styles.buttonIcon} />
            <Text style={styles.credencialesButtonText}>Restablecer contraseña</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showCredencialesModal}
          transparent
          animationType="slide"
          onRequestClose={closeCredencialesModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="lock-closed-outline" size={22} color={HoffColors.primary} />
                <Text style={styles.modalTitle}>Restablecer contraseña</Text>
              </View>

              <View style={styles.credencialesInfo}>
                <Text style={styles.credencialesLabel}>Usuario</Text>
                <View style={styles.credencialesValueContainer}>
                  <Text style={styles.credencialesValue}>@{trabajador.usuario}</Text>
                </View>

                <Text style={styles.credencialesLabel}>Tu contraseña de admin</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirma tu contraseña"
                  placeholderTextColor={HoffColors.textMuted}
                  secureTextEntry
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  editable={!resettingPassword}
                />
                <Text style={styles.credencialesLabel}>Nueva contraseña del staff</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={HoffColors.textMuted}
                  secureTextEntry
                  value={newWorkerPassword}
                  onChangeText={setNewWorkerPassword}
                  editable={!resettingPassword}
                />
                <Text style={styles.credencialesPasswordHelper}>
                  La contraseña actual no se puede ver por seguridad. Este proceso crea una nueva contraseña.
                </Text>
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={closeCredencialesModal}
                  disabled={resettingPassword}
                >
                  <Text style={styles.modalSecondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCloseButton, resettingPassword && styles.modalCloseButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={resettingPassword}
                >
                  {resettingPassword ? (
                    <ActivityIndicator color={HoffColors.white} />
                  ) : (
                    <Text style={styles.modalCloseButtonText}>Restablecer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  avatarBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.lg,
    marginBottom: taskSpacing.lg,
    paddingVertical: taskSpacing.sm,
  },
  avatarMeta: {
    flex: 1,
    gap: taskSpacing.sm,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: HoffColors.text,
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: taskSpacing.md,
    paddingVertical: taskSpacing.xs,
    borderRadius: taskRadius.sm,
  },
  estadoBadgeActivo: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    borderWidth: 1,
    borderColor: HoffColors.primary,
  },
  estadoBadgeInactivo: {
    backgroundColor: 'rgba(120, 120, 120, 0.12)',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  estadoBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: HoffColors.primaryDark,
  },
  estadoBadgeTextInactivo: {
    color: HoffColors.textSecondary,
  },
  infoRow: {
    marginTop: taskSpacing.md,
    paddingTop: taskSpacing.md,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: HoffColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: taskSpacing.xs,
  },
  value: {
    fontSize: 16,
    color: HoffColors.text,
    fontWeight: '500',
  },
  valueMultiline: {
    fontSize: 16,
    color: HoffColors.text,
    fontWeight: '500',
    lineHeight: 22,
  },
  helperText: {
    fontSize: 12,
    color: HoffColors.textMuted,
    fontStyle: 'italic',
    marginBottom: taskSpacing.md,
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
  buttonIcon: {
    marginRight: taskSpacing.xs,
  },
  editarPerfilButton: {
    marginTop: taskSpacing.xl,
    backgroundColor: HoffColors.primary,
    padding: taskSpacing.md + 4,
    borderRadius: taskRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editarPerfilButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  credencialesButton: {
    backgroundColor: HoffColors.primary,
    padding: taskSpacing.md + 2,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
    marginTop: taskSpacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  credencialesButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  estadisticasButton: {
    backgroundColor: HoffColors.accent,
    padding: taskSpacing.md + 2,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
    marginTop: taskSpacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  estadisticasButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: taskSpacing.lg,
  },
  modalContent: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.text,
    flex: 1,
  },
  credencialesInfo: {
    marginBottom: taskSpacing.lg,
  },
  credencialesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginTop: taskSpacing.md,
    marginBottom: taskSpacing.xs,
  },
  credencialesValueContainer: {
    backgroundColor: HoffColors.background,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  credencialesValue: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
  },
  credencialesPasswordHelper: {
    fontSize: 12,
    color: HoffColors.textMuted,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    flex: 1,
    backgroundColor: HoffColors.primary,
    padding: taskSpacing.md + 2,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
  },
  modalCloseButtonDisabled: {
    opacity: 0.6,
  },
  modalCloseButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: taskSpacing.md,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: taskSpacing.md + 2,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  modalSecondaryButtonText: {
    color: HoffColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
