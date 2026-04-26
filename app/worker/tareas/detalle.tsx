import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { getEstadoColor, getEstadoText, decimalATiempo } from '@/utils/tareas';
import { HoffColors } from '@/constants/theme';
import { taskSpacing } from '@/constants/taskUi';
import {
    TaskScreenContainer,
    TaskSection,
    StatusPill,
    TaskDetailRow,
    TaskPrimaryButton,
    TaskSecondaryButton,
    TaskEvidenceViewer,
} from '@/components/tareas';
import * as Haptics from 'expo-haptics';
import {
    pickTaskEvidencesFromLibrary,
    uploadTaskEvidence,
    MAX_TAREA_EVIDENCIAS,
} from '@/utils/mediaUpload';

export default function TareaDetalleScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [tarea, setTarea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComentariosModal, setShowComentariosModal] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [evidenciaLocal, setEvidenciaLocal] = useState<
    { uri: string; mimeType: string; fileName: string }[]
  >([]);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);

  const isFirstFocusRef = useRef(true);
  const detalleInFlightRef = useRef(false);
  useEffect(() => {
    isFirstFocusRef.current = true;
  }, [id]);

  const loadTareaDetalle = useCallback(async (opts?: { silent?: boolean }) => {
    if (detalleInFlightRef.current) return;
    detalleInFlightRef.current = true;
    const silent = Boolean(opts?.silent);
    try {
      if (!silent) setLoading(true);
      const response = await api.getTareaById(Number(id));
      if (response.success && response.data) {
        setTarea(response.data);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el detalle de la tarea');
    } finally {
      if (!silent) setLoading(false);
      detalleInFlightRef.current = false;
    }
  }, [id]);

  const refreshDetalle = useCallback(async () => {
    await loadTareaDetalle({ silent: true });
  }, [loadTareaDetalle]);

  useFocusEffect(
    useCallback(() => {
      const silent = !isFirstFocusRef.current;
      isFirstFocusRef.current = false;
      loadTareaDetalle({ silent });
    }, [loadTareaDetalle])
  );

  const handleCompletarTarea = () => {
    // Mostrar modal para agregar comentarios
    setShowComentariosModal(true);
  };

  const confirmarCompletar = async () => {
    setShowComentariosModal(false);
    
    try {
      setSubiendoEvidencia(true);
      const subidos: { url: string; path: string }[] = [];
      for (let i = 0; i < evidenciaLocal.length; i += 1) {
        const a = evidenciaLocal[i];
        const u = await uploadTaskEvidence('tarea_evidencia', {
          uri: a.uri,
          mimeType: a.mimeType || 'image/jpeg',
          fileName: a.fileName || `tarea-${tarea.id}-${i}-${Date.now()}.jpg`,
        });
        subidos.push({ url: u.url, path: u.path });
      }

      const response = await api.completarTarea(
        Number(tarea.id),
        user!.id,
        comentarios,
        { evidencias: subidos }
      );
      if (response.success) {
        setComentarios('');
        setEvidenciaLocal([]);
        await refreshDetalle();
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          /* haptics opcional */
        }
        Alert.alert(
          '¡Excelente!',
          'Tarea marcada como completada. El administrador la revisará pronto.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar la tarea');
    } finally {
      setSubiendoEvidencia(false);
    }
  };

  const handleAdjuntarEvidencia = async () => {
    const rem = MAX_TAREA_EVIDENCIAS - evidenciaLocal.length;
    if (rem < 1) {
      Alert.alert('Límite alcanzado', `Máximo ${MAX_TAREA_EVIDENCIAS} imágenes.`);
      return;
    }
    const picked = await pickTaskEvidencesFromLibrary(rem);
    if (picked.length === 0) return;
    setEvidenciaLocal((prev) => [...prev, ...picked].slice(0, MAX_TAREA_EVIDENCIAS));
  };

  const quitarEvidenciaLocal = (i: number) => {
    setEvidenciaLocal((prev) => prev.filter((_, j) => j !== i));
  };

  const handleLlamarCliente = () => {
    if (tarea?.cliente_telefono) {
      Linking.openURL(`tel:${tarea.cliente_telefono}`);
    }
  };

  const handleAbrirMaps = () => {
    if (tarea?.direccion_completa) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tarea.direccion_completa)}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!tarea) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tarea no encontrada</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Verificar si el trabajador está asignado a esta tarea
  const trabajadorAsignado = tarea.trabajadores?.some((t: any) => t.id === user?.id) || false;
  // Puede completar si está asignada O si está completada pero tiene mensaje_rechazo (fue devuelta)
  const puedeCompletar = (tarea.estado === 'asignada' ||
                          (tarea.estado === 'completada' && tarea.mensaje_rechazo)) &&
                         trabajadorAsignado;
  const enRevision = tarea.estado === 'completada' && !tarea.mensaje_rechazo;
  const aprobada = tarea.estado === 'aprobada';
  const esCancelada = tarea.estado === 'cancelada';

  return (
    <TaskScreenContainer bottomInsetExtra={72}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Card de Estado */}
      <TaskSection title="Estado">
        <StatusPill label={getEstadoText(tarea.estado)} backgroundColor={getEstadoColor(tarea.estado)} />
      </TaskSection>

      {/* Mensaje de rechazo del admin */}
      {tarea.mensaje_rechazo && (
        <TaskSection title="Aviso">
          <View style={[styles.rechazoBox, { backgroundColor: HoffColors.background }]}>
            <View style={styles.rechazoTitleRow}>
              <Ionicons name="warning-outline" size={20} color={HoffColors.accentDark} />
              <Text style={[styles.rechazoTitle, { color: HoffColors.accentDark }]}>
                Mensaje del administrador
              </Text>
            </View>
            <Text style={styles.rechazoText}>{tarea.mensaje_rechazo}</Text>
            <Text style={styles.rechazoNote}>
              Por favor, corrige lo indicado y vuelve a marcar la tarea como completada.
            </Text>
          </View>
        </TaskSection>
      )}

      {(() => {
        const uris: string[] =
          tarea.evidencias && tarea.evidencias.length > 0
            ? tarea.evidencias.map((e: { url: string }) => e.url)
            : tarea.evidencia_url
            ? [tarea.evidencia_url]
            : [];
        return uris.length > 0 ? <TaskEvidenceViewer imageUris={uris} title="Evidencia del trabajo" /> : null;
      })()}

      {/* Descripción */}
      <TaskSection title="Descripción del trabajo">
        <Text style={styles.description}>{tarea.descripcion_general}</Text>
        {tarea.detalles_especificos && (
          <>
            <Text style={styles.subsectionTitle}>Detalles específicos:</Text>
            <Text style={styles.details}>{tarea.detalles_especificos}</Text>
          </>
        )}
      </TaskSection>

      {/* Cliente */}
      <TaskSection title="Cliente">
        <Text style={styles.clientName}>{tarea.cliente_nombre}</Text>
        <View style={styles.clientTypeRow}>
          <Ionicons
            name={tarea.cliente_tipo === 'empresa' ? 'business-outline' : 'person-outline'}
            size={18}
            color={HoffColors.textSecondary}
            style={styles.clientTypeIcon}
          />
          <Text style={styles.clientType}>
            {tarea.cliente_tipo === 'empresa' ? 'Empresa' : 'Particular'}
          </Text>
        </View>
        {tarea.cliente_email && (
          <View style={styles.detailInlineRow}>
            <Ionicons name="mail-outline" size={18} color={HoffColors.textSecondary} />
            <Text style={styles.clientEmail}>{tarea.cliente_email}</Text>
          </View>
        )}
        {tarea.cliente_telefono && (
          <TouchableOpacity style={styles.contactButton} onPress={handleLlamarCliente}>
            <Ionicons name="call-outline" size={20} color={HoffColors.white} />
            <Text style={styles.contactButtonText}>{tarea.cliente_telefono}</Text>
          </TouchableOpacity>
        )}
      </TaskSection>

      {/* Administrador (solo para empresas) */}
      {tarea.cliente_tipo === 'empresa' && tarea.cliente_administrador_nombre && (
        <TaskSection title="Administrador de la empresa">
          <Text style={styles.clientName}>{tarea.cliente_administrador_nombre}</Text>
          {tarea.cliente_administrador_telefono && (
            <TouchableOpacity 
              style={styles.contactButton} 
              onPress={() => {
                if (tarea.cliente_administrador_telefono) {
                  Linking.openURL(`tel:${tarea.cliente_administrador_telefono}`);
                }
              }}
            >
              <Ionicons name="call-outline" size={20} color={HoffColors.white} />
              <Text style={styles.contactButtonText}>{tarea.cliente_administrador_telefono}</Text>
            </TouchableOpacity>
          )}
          {tarea.cliente_administrador_email && (
            <View style={styles.detailInlineRow}>
              <Ionicons name="mail-outline" size={18} color={HoffColors.textSecondary} />
              <Text style={styles.clientEmail}>{tarea.cliente_administrador_email}</Text>
            </View>
          )}
        </TaskSection>
      )}

      {/* Ubicación */}
      <TaskSection title="Ubicación">
        <Text style={styles.address}>{tarea.direccion_completa}</Text>
        <Text style={styles.city}>{tarea.codigo_postal && `${tarea.codigo_postal}, `}{tarea.ciudad}</Text>
        <TouchableOpacity style={styles.mapsButton} onPress={handleAbrirMaps}>
          <Ionicons name="map-outline" size={20} color={HoffColors.white} />
          <Text style={styles.mapsButtonText}>Abrir en Google Maps</Text>
        </TouchableOpacity>
      </TaskSection>

      {/* Fecha y horario */}
      <TaskSection title="Fecha y horario">
        <Text style={styles.date}>
          {new Date(tarea.fecha_realizacion).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </TaskSection>

      {/* Equipo de trabajo */}
      {tarea.trabajadores && tarea.trabajadores.length > 0 && (
        <TaskSection title="Equipo de trabajo">
          {tarea.trabajadores.map((trabajador: any) => (
            <View key={trabajador.id} style={styles.workerItem}>
              <View style={styles.workerNameRow}>
                <Ionicons name="construct-outline" size={18} color={HoffColors.primary} />
                <Text style={styles.workerName}>
                  {trabajador.id === user?.id ? 'Tú · ' : ''}{trabajador.nombre}
                </Text>
              </View>
            </View>
          ))}
          {/* Tiempo del servicio */}
          {(() => {
            const horasTrabajadores = tarea.trabajadores.map((trabajador: any) => {
              return (
                trabajador.horas_aprobadas ||
                trabajador.horas_asignadas ||
                (tarea.numero_horas ? tarea.numero_horas : 0)
              );
            });
            const tiempoServicio = horasTrabajadores.length > 0 ? Math.max(...horasTrabajadores.map((h: any) => parseFloat(h) || 0)) : 0;
            return tiempoServicio > 0 ? (
              <View style={styles.tiempoServicioBox}>
                <View style={styles.tiempoServicioLabelRow}>
                  <Ionicons name="timer-outline" size={18} color={HoffColors.primary} />
                  <Text style={styles.tiempoServicioLabel}>Tiempo del servicio</Text>
                </View>
                <Text style={styles.tiempoServicioValue}>{decimalATiempo(tiempoServicio)}</Text>
              </View>
            ) : null;
          })()}
        </TaskSection>
      )}

      {/* Horas asignadas */}
      <TaskSection title="Horas asignadas">
        {tarea.trabajadores && tarea.trabajadores.map((trabajador: any) => {
          if (trabajador.id === user?.id) {
            const horas =
              trabajador.horas_aprobadas ||
              trabajador.horas_asignadas ||
              tarea.numero_horas ||
              0;
            return (
              <Text key={trabajador.id} style={styles.hoursTotal}>
                Tus horas: {decimalATiempo(parseFloat(horas))}
              </Text>
            );
          }
          return null;
        })}
        {!puedeCompletar && !enRevision && !aprobada && !esCancelada && (
          <Text style={styles.hoursNote}>
            Puedes editar la asignación de horas desde el panel de administración hasta que la tarea se marque como completada.
          </Text>
        )}
      </TaskSection>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        {puedeCompletar && (
          <View style={styles.primaryActionWithIcon}>
            <Ionicons name="checkmark-circle-outline" size={22} color={HoffColors.primaryDark} />
            <TaskPrimaryButton
              label={
                tarea.estado === 'completada' && tarea.mensaje_rechazo
                  ? 'Completar de nuevo'
                  : 'Marcar como completada'
              }
              onPress={handleCompletarTarea}
              style={styles.taskBtnFlex}
            />
          </View>
        )}

        {enRevision && (
          <View style={[styles.infoBox, { backgroundColor: HoffColors.secondaryMuted }]}>
            <View style={styles.infoBoxInner}>
              <Ionicons name="eye-outline" size={22} color={HoffColors.primary} />
              <Text style={[styles.infoBoxText, { color: HoffColors.primary }]}>
                Esta tarea está en revisión por el administrador
              </Text>
            </View>
          </View>
        )}

        {/* Información de aprobación (sin estado de pago) */}
        {aprobada && tarea.registro_aprobacion && (
          <TaskSection title="Tarea aprobada">
            
            <View style={[styles.infoBox, { backgroundColor: HoffColors.secondaryMuted }]}>
              <View style={styles.infoBoxInner}>
                <Ionicons name="checkmark-circle-outline" size={22} color={HoffColors.primary} />
                <Text style={[styles.infoBoxText, { color: HoffColors.primary }]}>
                  Tarea aprobada — trabajo confirmado
                </Text>
              </View>
            </View>
            
            {/* Información básica de aprobación */}
            <View style={styles.aprobacionInfo}>
              <TaskDetailRow
                icon="calendar-outline"
                label="Aprobada el"
                value={new Date(tarea.registro_aprobacion.fecha_aprobacion).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              />
              <TaskDetailRow
                icon="person-outline"
                label="Aprobada por"
                value={tarea.registro_aprobacion.aprobado_por_nombre}
              />
              {tarea.registro_aprobacion.notas_aprobacion && (
                <TaskDetailRow
                  inline={false}
                  icon="document-text-outline"
                  label="Notas"
                  value={tarea.registro_aprobacion.notas_aprobacion}
                />
              )}
            </View>
            
            {/* Horas aprobadas finales del trabajador */}
            {tarea.horas_aprobadas_finales && tarea.horas_aprobadas_finales.length > 0 && (
              <View style={styles.horasFinalesSection}>
                <Text style={styles.subsectionTitle}>Tus horas aprobadas</Text>
                {tarea.horas_aprobadas_finales
                  .filter((item: any) => item.trabajador_id === user?.id)
                  .map((item: any) => (
                    <View key={item.trabajador_id} style={styles.horaFinalRow}>
                      <Text style={styles.horaFinalLabel}>Horas aprobadas:</Text>
                      <Text style={styles.horaFinalValor}>
                        {decimalATiempo(parseFloat(item.horas_aprobadas_finales))}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </TaskSection>
        )}

        {/* Sección de cancelación */}
        {esCancelada && (
          <TaskSection title="Tarea cancelada">
            
            <View style={[styles.infoBox, { backgroundColor: HoffColors.background }]}>
              <View style={styles.infoBoxInner}>
                <Ionicons name="close-circle-outline" size={22} color={HoffColors.accentDark} />
                <Text style={[styles.infoBoxText, { color: HoffColors.accentDark }]}>
                  Esta tarea ha sido cancelada
                </Text>
              </View>
            </View>
            
            {/* Información de cancelación */}
            <View style={styles.cancelacionInfo}>
              <TaskDetailRow
                icon="calendar-outline"
                label="Cancelada el"
                value={
                  tarea.ultima_actualizacion 
                    ? new Date(tarea.ultima_actualizacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Fecha no disponible'
                }
              />
            </View>
            
            <View style={[styles.infoBox, { backgroundColor: HoffColors.background, marginTop: taskSpacing.md }]}>
              <View style={styles.infoBoxInner}>
                <Ionicons name="information-circle-outline" size={20} color={HoffColors.accentDark} />
                <Text style={[styles.infoBoxText, { color: HoffColors.accentDark }]}>
                  Esta tarea ha sido cancelada y no requiere acción de tu parte.
                </Text>
              </View>
            </View>
          </TaskSection>
        )}
      </View>

      {/* Modal de comentarios al completar */}
      <Modal
        visible={showComentariosModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComentariosModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Completar Tarea</Text>
            <Text style={styles.modalSubtitle}>
              Agrega comentarios sobre el trabajo realizado (opcional):
            </Text>
            
            <TextInput
              style={styles.comentariosInput}
              placeholder="Ej: Cliente satisfecho, área extra limpiada..."
              multiline
              numberOfLines={4}
              value={comentarios}
              onChangeText={setComentarios}
              textAlignVertical="top"
            />

            <Text style={styles.evidHint}>
              Puedes adjuntar hasta {MAX_TAREA_EVIDENCIAS} imágenes (opcional). Quedan{' '}
              {MAX_TAREA_EVIDENCIAS - evidenciaLocal.length}.
            </Text>
            <TouchableOpacity style={styles.adjuntarBtn} onPress={handleAdjuntarEvidencia}>
              <Ionicons name="image-outline" size={18} color={HoffColors.primary} />
              <Text style={styles.adjuntarBtnText}>Añadir imágenes</Text>
            </TouchableOpacity>
            {evidenciaLocal.length > 0 && (
              <View style={styles.previewRow}>
                {evidenciaLocal.map((a, i) => (
                  <View key={`${a.uri}-${i}`} style={styles.previewItem}>
                    <Image source={{ uri: a.uri }} style={styles.previewImage} resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => quitarEvidenciaLocal(i)}
                      style={styles.removeCircle}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={24} color={HoffColors.accentDark} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TaskSecondaryButton
                label="Cancelar"
                onPress={() => {
                  setShowComentariosModal(false);
                  setComentarios('');
                  setEvidenciaLocal([]);
                }}
                style={styles.modalSecondaryFlex}
              />
              <View style={styles.modalPrimaryWrap}>
                <Ionicons name="checkmark-circle-outline" size={20} color={HoffColors.primaryDark} />
                <TaskPrimaryButton
                  label={subiendoEvidencia ? 'Subiendo...' : 'Completar'}
                  onPress={confirmarCompletar}
                  style={styles.taskBtnFlex}
                  disabled={subiendoEvidencia}
                  loading={subiendoEvidencia}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: taskSpacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HoffColors.background,
  },
  loadingText: {
    marginTop: taskSpacing.md,
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: HoffColors.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: HoffColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: HoffColors.text,
    lineHeight: 22,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  details: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    lineHeight: 20,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 4,
  },
  clientTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  clientTypeIcon: {
    marginRight: 0,
  },
  clientType: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  clientEmail: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginTop: 0,
    marginBottom: 0,
  },
  detailInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  contactButton: {
    backgroundColor: HoffColors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  contactButtonText: {
    color: HoffColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  address: {
    fontSize: 15,
    color: HoffColors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  city: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginBottom: 12,
  },
  mapsButton: {
    backgroundColor: HoffColors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mapsButtonText: {
    color: HoffColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 16,
    color: HoffColors.text,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  hours: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  workerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
    color: HoffColors.text,
    flex: 1,
  },
  hoursTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.primary,
    marginBottom: 8,
  },
  hoursNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  primaryActionWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  taskBtnFlex: {
    flex: 1,
  },
  startButton: {
    backgroundColor: '#FFC107',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: HoffColors.secondaryMuted,
    padding: 16,
    borderRadius: 12,
    alignItems: 'stretch',
  },
  infoBoxInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoBoxText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: HoffColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  comentariosInput: {
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  modalSecondaryFlex: {
    flex: 1,
  },
  modalPrimaryWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  evidHint: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.sm,
  },
  adjuntarBtn: {
    marginBottom: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: HoffColors.secondaryMuted,
  },
  adjuntarBtnText: {
    color: HoffColors.primary,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: taskSpacing.sm,
    marginBottom: taskSpacing.md,
  },
  previewItem: {
    position: 'relative',
  },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: 8,
    backgroundColor: HoffColors.background,
  },
  removeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  rechazoBox: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: HoffColors.accent,
  },
  rechazoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rechazoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 0,
    flex: 1,
  },
  rechazoText: {
    fontSize: 14,
    color: HoffColors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  rechazoNote: {
    fontSize: 12,
    color: HoffColors.accentDark,
    fontStyle: 'italic',
    marginTop: 4,
  },
  aprobacionInfo: {
    marginTop: 12,
    marginBottom: 12,
  },
  aprobacionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  aprobacionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 120,
  },
  aprobacionValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  cancelacionInfo: {
    marginTop: 12,
    marginBottom: 12,
  },
  cancelacionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  cancelacionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 120,
  },
  cancelacionValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  horasFinalesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  horaFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  horaFinalLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  horaFinalValor: {
    fontSize: 14,
    color: HoffColors.primary,
    fontWeight: '600',
  },
  tiempoServicioBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: HoffColors.secondaryMuted,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  tiempoServicioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tiempoServicioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.primary,
  },
  tiempoServicioValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.primary,
  },
});
