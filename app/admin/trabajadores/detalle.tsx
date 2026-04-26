import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { ProfilePhotoFormSection } from '@/components/admin/ProfilePhotoFormSection';

export default function DetalleTrabajadorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [trabajador, setTrabajador] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activo, setActivo] = useState(true);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [showCredencialesModal, setShowCredencialesModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadTrabajador();
    }
  }, [id]);

  const loadTrabajador = async () => {
    try {
      setLoading(true);
      const response = await api.getTrabajadorById(Number(id));
      if (response.success && response.data) {
        const data = response.data;
        setTrabajador(data);
        setNombre(data.nombre || '');
        setDescripcion(data.descripcion || '');
        setFotoPerfil(data.foto_perfil || '');
        setActivo(data.activo !== undefined ? data.activo : true);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el trabajador');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    setSaving(true);

    try {
      const trabajadorData: any = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        activo: activo,
        foto_perfil: fotoPerfil.trim() || null,
      };

      const response = await api.updateTrabajador(Number(id), trabajadorData);

      if (response.success) {
        Alert.alert(
          'Trabajador actualizado',
          'Los cambios se han guardado correctamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el trabajador');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando trabajador...</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  if (!trabajador) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Trabajador no encontrado</Text>
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
            <Ionicons name="person-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Información del perfil</Text>
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

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Descripción del trabajador (opcional)"
            placeholderTextColor={HoffColors.textMuted}
            multiline
            numberOfLines={4}
            value={descripcion}
            onChangeText={setDescripcion}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Fecha de registro</Text>
          <Text style={styles.infoText}>
            {new Date(trabajador.fecha_creacion || Date.now()).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bar-chart-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Estadísticas</Text>
          </View>
          <Text style={styles.helperText}>
            Ver estadísticas detalladas del trabajador, incluyendo tareas aprobadas y horas trabajadas por período
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
          <Text style={styles.helperText}>Ver las credenciales de acceso del trabajador</Text>
          <TouchableOpacity style={styles.credencialesButton} onPress={() => setShowCredencialesModal(true)}>
            <Ionicons name="eye-outline" size={18} color={HoffColors.white} style={styles.buttonIcon} />
            <Text style={styles.credencialesButtonText}>Ver credenciales</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.estadoContainer}>
            <Text style={styles.sectionTitle}>Estado del trabajador</Text>
            <View style={styles.estadoRow}>
              <Text style={styles.estadoLabel}>
                {activo ? 'Trabajador activo' : 'Trabajador desactivado'}
              </Text>
              <TouchableOpacity
                style={[styles.estadoButton, activo ? styles.estadoButtonActive : styles.estadoButtonInactive]}
                onPress={() => {
                  if (activo) {
                    Alert.alert(
                      '¿Desactivar trabajador?',
                      'Al desactivar el trabajador, no podrá iniciar sesión ni ser asignado a nuevas tareas. El trabajador no aparecerá en las listas de selección pero podrá ser reactivado más adelante.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Desactivar',
                          style: 'destructive',
                          onPress: () => setActivo(false),
                        },
                      ]
                    );
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
                Este trabajador está desactivado y no aparecerá en las listas de selección.
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

        <Modal
          visible={showCredencialesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCredencialesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="lock-closed-outline" size={22} color={HoffColors.primary} />
                <Text style={styles.modalTitle}>Credenciales de acceso</Text>
              </View>

              <View style={styles.credencialesInfo}>
                <Text style={styles.credencialesLabel}>Usuario</Text>
                <View style={styles.credencialesValueContainer}>
                  <Text style={styles.credencialesValue}>@{trabajador.usuario}</Text>
                </View>

                <Text style={styles.credencialesLabel}>Contraseña</Text>
                <View style={styles.credencialesPasswordContainer}>
                  <Text style={styles.credencialesPasswordText}>••••••••••••</Text>
                  <Text style={styles.credencialesPasswordHelper}>
                    La contraseña está encriptada por seguridad. Para cambiarla, el trabajador debe usar la opción de
                    cambiar contraseña en su perfil.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCredencialesModal(false)}>
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  infoText: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginTop: taskSpacing.xs,
  },
  buttonIcon: {
    marginRight: taskSpacing.xs,
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
  credencialesPasswordContainer: {
    backgroundColor: HoffColors.background,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  credencialesPasswordText: {
    fontSize: 18,
    fontWeight: '600',
    color: HoffColors.text,
    letterSpacing: 4,
    marginBottom: taskSpacing.sm,
  },
  credencialesPasswordHelper: {
    fontSize: 12,
    color: HoffColors.textMuted,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: HoffColors.primary,
    padding: taskSpacing.md + 2,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
