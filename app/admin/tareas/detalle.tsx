import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
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
import {
  decimalATiempo,
  getEstadoColor,
  getEstadoText,
  tiempoADecimal,
  validarFormatoTiempo,
} from '@/utils/tareas';

export default function TareaDetalleScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [tarea, setTarea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notasAprobacion, setNotasAprobacion] = useState('');
  const [horasPorTrabajador, setHorasPorTrabajador] = useState<{[key: number]: number}>({});
  const [horasTiempoPorTrabajador, setHorasTiempoPorTrabajador] = useState<{[key: number]: string}>({});
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [mensajeRechazo, setMensajeRechazo] = useState('');
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState<number | null>(null);
  const [horasAsignar, setHorasAsignar] = useState('0:00');
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [savingAsignacion, setSavingAsignacion] = useState(false);
  const [showDesasignarModal, setShowDesasignarModal] = useState(false);
  const [desasignarTarget, setDesasignarTarget] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [desasignando, setDesasignando] = useState(false);
  const [aprobando, setAprobando] = useState(false);

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

        if (response.data.trabajadores) {
          const horasIniciales: { [key: number]: number } = {};
          const horasTiempoIniciales: { [key: number]: string } = {};
          const n = Number(response.data.numero_horas);
          response.data.trabajadores.forEach((trabajador: any) => {
            const horasDecimal =
              trabajador.horas_aprobadas ||
              trabajador.horas_asignadas ||
              (Number.isFinite(n) ? n : 0);
            horasIniciales[trabajador.id] = horasDecimal;
            horasTiempoIniciales[trabajador.id] = decimalATiempo(horasDecimal);
          });
          setHorasPorTrabajador(horasIniciales);
          setHorasTiempoPorTrabajador(horasTiempoIniciales);
        }
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

  const updateHoras = (trabajadorId: number, tiempo: string) => {
    // Filtrar solo números y ":"
    const filtered = tiempo.replace(/[^0-9:]/g, '');
    
    // Validar formato antes de actualizar
    if (filtered && !validarFormatoTiempo(filtered)) {
      return; // No actualizar si el formato es inválido
    }
    
    // Convertir tiempo a decimal para almacenar
    const horasNum = tiempoADecimal(filtered);
    
    setHorasPorTrabajador({
      ...horasPorTrabajador,
      [trabajadorId]: horasNum
    });
    
    setHorasTiempoPorTrabajador({
      ...horasTiempoPorTrabajador,
      [trabajadorId]: filtered || '0:00'
    });
  };

  const getTiempoServicio = () => {
    const horas = Object.values(horasPorTrabajador);
    return horas.length > 0 ? Math.max(...horas) : 0;
  };

  const handleAprobarTarea = async () => {
    if (!user?.id || user.tipo !== 'admin') {
      Alert.alert('Error', 'Se requiere sesión de administrador para aprobar.');
      return;
    }

    const tiempoServicio = getTiempoServicio();
    const mensajeConfirm = `Tiempo del servicio: ${tiempoServicio}h\n\n¿Confirmas que el trabajo se realizó correctamente? Esto creará un registro permanente.`;

    // En web, Alert.alert con varios botones no siempre ejecuta onPress; usar confirm nativo del navegador.
    let confirmado = false;
    if (Platform.OS === 'web') {
      confirmado = window.confirm(`¿Aprobar tarea?\n\n${mensajeConfirm}`);
    } else {
      confirmado = await new Promise<boolean>((resolve) => {
        Alert.alert('¿Aprobar tarea?', mensajeConfirm, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Aprobar', style: 'default', onPress: () => resolve(true) },
        ]);
      });
    }

    if (!confirmado || aprobando) return;

    const horasArray = Object.entries(horasPorTrabajador)
      .map(([trabajadorId, horas]) => ({
        trabajador_id: parseInt(trabajadorId, 10),
        horas: Number(horas),
      }))
      .filter((row) => Number.isFinite(row.horas) && Number.isFinite(row.trabajador_id));

    try {
      setAprobando(true);
      const response = await api.aprobarTarea(
        Number(tarea.id),
        user.id,
        notasAprobacion || undefined,
        horasArray.length > 0 ? horasArray : undefined
      );

      if (!response?.success) {
        Alert.alert(
          'Error',
          (response as { error?: string })?.error || 'No se pudo aprobar la tarea'
        );
        return;
      }

      await refreshDetalle();
      setNotasAprobacion('');
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* haptics opcional */
      }
      Alert.alert(
        '¡Tarea aprobada!',
        `Registro permanente creado.\nTiempo del servicio: ${tiempoServicio}h`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo aprobar la tarea');
    } finally {
      setAprobando(false);
    }
  };

  const handleDevolverTarea = () => {
    setShowDevolverModal(true);
  };

  const confirmarDevolver = async () => {
    if (!mensajeRechazo.trim()) {
      Alert.alert('Error', 'Debes proporcionar un mensaje para devolver la tarea');
      return;
    }

    setShowDevolverModal(false);
    
    try {
      const response = await api.devolverTarea(
        Number(tarea.id),
        user!.id,
        mensajeRechazo
      );
      
      if (response.success) {
        setMensajeRechazo('');
        await refreshDetalle();
        Alert.alert(
          'Tarea devuelta',
          'La tarea ha sido devuelta a los trabajadores con tu mensaje.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo devolver la tarea');
    }
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

  const loadTrabajadores = async () => {
    try {
      setLoadingTrabajadores(true);
      const response = await api.getTrabajadores();
      if (response.success && response.data) {
        // Filtrar trabajadores activos y que no estén ya asignados
        const trabajadoresAsignados = tarea.trabajadores?.map((t: any) => t.id) || [];
        const disponibles = response.data.filter(
          (t: any) => t.activo && !trabajadoresAsignados.includes(t.id)
        );
        setTrabajadores(disponibles);
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los trabajadores');
    } finally {
      setLoadingTrabajadores(false);
    }
  };

  const handleAbrirAsignarModal = () => {
    loadTrabajadores();
    setShowAsignarModal(true);
    if (tarea.numero_horas != null && Number.isFinite(Number(tarea.numero_horas))) {
      setHorasAsignar(decimalATiempo(Number(tarea.numero_horas)));
    } else {
      setHorasAsignar('0:00');
    }
  };

  const handleGuardarAsignacion = async () => {
    if (!trabajadorSeleccionado) {
      Alert.alert('Error', 'Selecciona un trabajador');
      return;
    }
    if (savingAsignacion) return;

    const raw = tiempoADecimal(horasAsignar);
    let horasParaApi: number | undefined;
    if (!Number.isFinite(raw) || raw <= 0) {
      horasParaApi = undefined;
    } else if (tarea.numero_horas != null && Number.isFinite(Number(tarea.numero_horas))) {
      horasParaApi = Math.min(raw, Number(tarea.numero_horas));
    } else {
      horasParaApi = raw;
    }

    try {
      setSavingAsignacion(true);
      const response = await api.asignarTrabajador(
        Number(tarea.id),
        trabajadorSeleccionado,
        horasParaApi
      );

      if (!response.success) {
        Alert.alert(
          'Error',
          (response as { error?: string }).error || 'No se pudo asignar el trabajador'
        );
        return;
      }

      await refreshDetalle();
      setShowAsignarModal(false);
      setTrabajadorSeleccionado(null);
      setHorasAsignar('0:00');
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* haptics opcional */
      }
      Alert.alert('Éxito', 'Trabajador asignado correctamente', [{ text: 'OK' }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo asignar el trabajador');
    } finally {
      setSavingAsignacion(false);
    }
  };

  const handleGuardarHorasAsignadas = async (trabajadorId: number) => {
    const tiempo = horasTiempoPorTrabajador[trabajadorId] || '0:00';
    if (!validarFormatoTiempo(tiempo)) {
      Alert.alert('Error', 'Usa el formato de horas H:MM o HH:MM (ej. 3:30)');
      return;
    }
    const decimal = tiempoADecimal(tiempo);
    const maxH = tarea.numero_horas != null ? Number(tarea.numero_horas) : null;
    if (maxH != null && Number.isFinite(maxH) && decimal > maxH) {
      Alert.alert(
        'Error',
        `Las horas no pueden superar la duración de la tarea (${decimalATiempo(maxH)}).`
      );
      return;
    }
    try {
      const response = await api.actualizarHorasTrabajador(
        Number(tarea.id),
        trabajadorId,
        decimal
      );
      if (response.success) {
        await refreshDetalle();
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          /* haptics opcional */
        }
        Alert.alert('Guardado', 'Horas del trabajador actualizadas');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron actualizar las horas');
    }
  };

  const cerrarModalDesasignar = () => {
    if (desasignando) return;
    setShowDesasignarModal(false);
    setDesasignarTarget(null);
  };

  const handleDesasignarTrabajador = (trabajadorId: number, trabajadorNombre: string) => {
    setDesasignarTarget({ id: trabajadorId, nombre: trabajadorNombre });
    setShowDesasignarModal(true);
  };

  const confirmarDesasignar = async () => {
    if (!desasignarTarget || desasignando || !tarea?.id) return;

    try {
      setDesasignando(true);
      const response = await api.desasignarTrabajador(Number(tarea.id), desasignarTarget.id);
      if (!response.success) {
        Alert.alert(
          'Error',
          (response as { error?: string }).error || 'No se pudo desasignar el trabajador'
        );
        return;
      }

      await refreshDetalle();
      setShowDesasignarModal(false);
      setDesasignarTarget(null);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* haptics opcional */
      }
      Alert.alert('Éxito', 'Trabajador desasignado', [{ text: 'OK' }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo desasignar el trabajador');
    } finally {
      setDesasignando(false);
    }
  };

  const handleCancelarTarea = () => {
    Alert.alert(
      '¿Cancelar tarea?',
      'Esta acción cambiará el estado de la tarea a "cancelada". ¿Estás seguro?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.cancelarTarea(Number(tarea.id));
              if (response.success) {
                await refreshDetalle();
                Alert.alert('Éxito', 'Tarea cancelada', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo cancelar la tarea');
            }
          }
        }
      ]
    );
  };

  const handleEditarTarea = () => {
    if (!tarea?.id) return;
    router.push(`/admin/tareas/editar?id=${tarea.id}`);
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

  const puedeAprobar = tarea.estado === 'completada';
  const aprobada = tarea.estado === 'aprobada';
  const esPendiente = tarea.estado === 'pendiente';
  const esAsignada = tarea.estado === 'asignada';
  const esCancelada = tarea.estado === 'cancelada';

  return (
    <TaskScreenContainer bottomInsetExtra={72}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Card de Estado */}
      <TaskSection title="Estado">
        <StatusPill label={getEstadoText(tarea.estado)} backgroundColor={getEstadoColor(tarea.estado)} />
      </TaskSection>

      {/* Descripción */}
      <TaskSection title="Descripción del servicio">
        <Text style={styles.description}>{tarea.descripcion_general}</Text>
        {tarea.detalles_especificos && (
          <>
            <Text style={styles.subsectionTitle}>Detalles específicos:</Text>
            <Text style={styles.details}>{tarea.detalles_especificos}</Text>
          </>
        )}
      </TaskSection>

      {/* Información Financiera */}
      <TaskSection title="Información financiera">
        <View style={styles.financeRow}>
          <Text style={styles.financeLabel}>Valor del servicio:</Text>
          <Text style={styles.financeValue}>€{parseFloat(tarea.valor_servicio).toFixed(2)}</Text>
        </View>
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
      <TaskSection title="Programación">
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Fecha de realización:</Text>
          <Text style={styles.date}>
            {new Date(tarea.fecha_realizacion).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Creada el:</Text>
          <Text style={styles.dateSmall}>
            {new Date(tarea.fecha_creacion).toLocaleDateString('es-ES')}
          </Text>
        </View>
      </TaskSection>

      {/* Equipo de trabajo */}
      {tarea.trabajadores && tarea.trabajadores.length > 0 && (
        <TaskSection title="Trabajadores asignados">
          {tarea.trabajadores.map((trabajador: any) => (
            <View key={trabajador.id} style={styles.workerItem}>
              <View style={styles.workerNameRow}>
                <Ionicons name="construct-outline" size={18} color={HoffColors.primary} />
                <Text style={styles.workerName}>{trabajador.nombre}</Text>
              </View>
              <Text style={styles.workerHours}>
                {trabajador.horas_asignadas
                  ? `${decimalATiempo(parseFloat(trabajador.horas_asignadas))} asignadas`
                  : tarea.numero_horas
                    ? `${decimalATiempo(tarea.numero_horas)} (duración tarea)`
                    : 'Sin horas definidas'}
              </Text>
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

      {/* Comentarios del trabajador */}
      {tarea.comentarios_trabajador && (
        <TaskSection title="Comentarios del trabajador">
          <View style={styles.comentariosBox}>
            <Text style={styles.comentariosText}>{tarea.comentarios_trabajador}</Text>
          </View>
        </TaskSection>
      )}

      {(() => {
        const uris =
          tarea.evidencias && tarea.evidencias.length > 0
            ? tarea.evidencias.map((e: { url: string }) => e.url)
            : tarea.evidencia_url
              ? [tarea.evidencia_url]
              : [];
        return uris.length > 0 ? <TaskEvidenceViewer imageUris={uris} title="Evidencia del trabajo" /> : null;
      })()}

      {/* Mensaje de rechazo si existe */}
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
          </View>
        </TaskSection>
      )}

      {/* Aprobar tarea (solo si está completada) */}
      {puedeAprobar && (
        <TaskSection title="Aprobar trabajo">
          
          {/* Ajustar horas individuales */}
          <Text style={styles.subsectionTitle}>Ajustar horas por trabajador:</Text>
          <Text style={styles.hoursHelp}>
            Modifica las horas solo si es necesario. Por defecto se usan las horas asignadas.
          </Text>
          
          {tarea.trabajadores && tarea.trabajadores.map((trabajador: any) => (
            <View key={trabajador.id} style={styles.hoursAdjustRow}>
              <Text style={styles.trabajadorNombre}>{trabajador.nombre}</Text>
              <View style={styles.hoursInputContainer}>
                <TextInput
                  style={styles.hoursInput}
                  value={horasTiempoPorTrabajador[trabajador.id] || '0:00'}
                  onChangeText={(value) => updateHoras(trabajador.id, value)}
                  keyboardType="default"
                  placeholder="0:00"
                />
                <Text style={styles.hoursLabel}>h (formato: 3:30)</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.servicioTiempoBox}>
            <View style={styles.tiempoServicioLabelRow}>
              <Ionicons name="timer-outline" size={18} color={HoffColors.primary} />
              <Text style={styles.servicioTiempoLabel}>Tiempo del servicio</Text>
            </View>
            <Text style={styles.servicioTiempoValue}>{decimalATiempo(getTiempoServicio())}</Text>
          </View>
          <Text style={styles.servicioTiempoNote}>
            (Tiempo = máximo de horas individuales)
          </Text>
          
          {/* Notas del admin */}
          <Text style={styles.approvalLabel}>Notas de aprobación (opcional):</Text>
          <TextInput
            style={styles.notasInput}
            placeholder="Ej: Trabajo excelente, se agregó 1h extra a Juan"
            value={notasAprobacion}
            onChangeText={setNotasAprobacion}
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.primaryActionWithIcon}>
            <Ionicons name="checkmark-circle-outline" size={22} color={HoffColors.primaryDark} />
            <TaskPrimaryButton
              label="Aprobar y crear registro permanente"
              onPress={handleAprobarTarea}
              disabled={aprobando}
              loading={aprobando}
              style={styles.taskBtnFlex}
            />
          </View>
          <View style={styles.warningInline}>
            <Ionicons name="warning-outline" size={16} color={HoffColors.accent} />
            <Text style={styles.approvalWarning}>
              Al aprobar se creará un registro inmutable para nóminas y contabilidad
            </Text>
          </View>

          <View style={styles.secondaryActionWithIcon}>
            <Ionicons name="arrow-undo-outline" size={22} color={HoffColors.textSecondary} />
            <TaskSecondaryButton
              label="Devolver tarea"
              onPress={handleDevolverTarea}
              style={styles.taskBtnFlex}
            />
          </View>
          <Text style={styles.devolverHelp}>
            Usa este botón si falta información o necesitas que corrijan algo
          </Text>
        </TaskSection>
      )}

      {/* Modal para devolver tarea */}
      <Modal
        visible={showDevolverModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDevolverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Devolver Tarea</Text>
            <Text style={styles.modalSubtitle}>
              Escribe un mensaje explicando qué falta o qué necesita corregirse:
            </Text>
            
            <TextInput
              style={styles.mensajeInput}
              placeholder="Ej: Falta subir imagen del baño, necesito ver foto del trabajo finalizado..."
              multiline
              numberOfLines={4}
              value={mensajeRechazo}
              onChangeText={setMensajeRechazo}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setShowDevolverModal(false);
                  setMensajeRechazo('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={confirmarDevolver}
              >
                <View style={styles.modalConfirmInner}>
                  <Ionicons name="arrow-undo-outline" size={18} color={HoffColors.white} />
                  <Text style={styles.modalConfirmText}>Devolver</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Información del registro permanente si está aprobada */}
      {aprobada && tarea.registro_aprobacion && (
        <TaskSection title="Registro permanente de aprobación">
          
          <View style={[styles.infoBox, { backgroundColor: HoffColors.secondaryMuted }]}>
            <View style={styles.infoBoxInner}>
              <Ionicons name="checkmark-circle-outline" size={22} color={HoffColors.primary} />
              <Text style={[styles.infoBoxText, { color: HoffColors.primary }]}>
                Tarea aprobada — registro permanente creado
              </Text>
            </View>
          </View>
          
          {/* Información de aprobación */}
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

          <View style={[styles.infoBox, { marginTop: 12 }]}>
            <View style={styles.infoBoxInner}>
              <Ionicons name="information-circle-outline" size={20} color={HoffColors.textSecondary} />
              <Text style={[styles.infoBoxText, { color: HoffColors.textSecondary }]}>
                El valor del servicio (€{parseFloat(tarea.valor_servicio).toFixed(2)}) queda contabilizado en Finanzas al aprobar la tarea.
              </Text>
            </View>
          </View>
          
          {/* Información de nómina */}
          <View style={styles.nominaSection}>
            <Text style={styles.subsectionTitle}>Información de nómina</Text>
            <TaskDetailRow
              icon="calendar-outline"
              label="Período"
              value={`${tarea.registro_aprobacion.mes_nomina}/${tarea.registro_aprobacion.anio_nomina}`}
            />
            <TaskDetailRow
              icon="timer-outline"
              label="Total horas"
              value={decimalATiempo(parseFloat(tarea.registro_aprobacion.total_horas_trabajadas))}
            />
            <TaskDetailRow
              icon="people-outline"
              label="Trabajadores"
              value={String(tarea.registro_aprobacion.numero_trabajadores)}
            />
          </View>
          
          {/* Horas aprobadas finales por trabajador */}
          {tarea.horas_aprobadas_finales && tarea.horas_aprobadas_finales.length > 0 && (
            <View style={styles.horasFinalesSection}>
              <Text style={styles.subsectionTitle}>Horas aprobadas finales</Text>
              {tarea.horas_aprobadas_finales.map((item: any) => (
                <View key={item.trabajador_id} style={styles.horaFinalRow}>
                  <Text style={styles.horaFinalNombre}>{item.trabajador_nombre}:</Text>
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
            {tarea.notas_internas && (
              <TaskDetailRow
                inline={false}
                icon="document-text-outline"
                label="Notas"
                value={tarea.notas_internas}
              />
            )}
          </View>
          
          <View style={[styles.infoBox, { backgroundColor: HoffColors.background, marginTop: 12 }]}>
            <View style={styles.infoBoxInner}>
              <Ionicons name="information-circle-outline" size={20} color={HoffColors.accentDark} />
              <Text style={[styles.infoBoxText, { color: HoffColors.accentDark }]}>
                Una tarea cancelada no puede ser modificada ni reactivada. Si necesitas realizar este trabajo, crea una nueva tarea.
              </Text>
            </View>
          </View>
        </TaskSection>
      )}

      {/* Notas internas (solo si no está cancelada) */}
      {tarea.notas_internas && !esCancelada && (
        <TaskSection title="Notas internas">
          <Text style={styles.notes}>{tarea.notas_internas}</Text>
        </TaskSection>
      )}

      {/* Acciones para estado pendiente */}
      {esPendiente && (
        <TaskSection title="Acciones">
          
          {/* Asignar trabajadores */}
          <View style={styles.primaryActionWithIcon}>
            <Ionicons name="person-add-outline" size={22} color={HoffColors.primaryDark} />
            <TaskPrimaryButton
              label="Asignar trabajador"
              onPress={handleAbrirAsignarModal}
              style={styles.taskBtnFlex}
            />
          </View>

          {/* Desasignar trabajadores (si hay asignados) */}
          {tarea.trabajadores && tarea.trabajadores.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Trabajadores asignados:</Text>
              <Text style={styles.hoursHelp}>
                Ajusta las horas por persona (como máximo la duración de la tarea) y pulsa Guardar.
              </Text>
              {tarea.trabajadores.map((trabajador: any) => (
                <View key={trabajador.id} style={styles.trabajadorAsignadoBlock}>
                  <View style={styles.trabajadorAsignadoHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={styles.workerNameRow}>
                        <Ionicons name="construct-outline" size={18} color={HoffColors.primary} />
                        <Text style={styles.trabajadorAsignadoNombre}>{trabajador.nombre}</Text>
                      </View>
                      <Text style={styles.trabajadorHoras}>
                        {trabajador.horas_asignadas
                          ? `Asignadas: ${decimalATiempo(parseFloat(trabajador.horas_asignadas))}`
                          : tarea.numero_horas
                            ? `Por defecto: ${decimalATiempo(tarea.numero_horas)}`
                            : 'Sin horas en tarea'}
                      </Text>
                      <View style={styles.horasEdicionRow}>
                        <TextInput
                          style={styles.horasEdicionInput}
                          value={horasTiempoPorTrabajador[trabajador.id] || '0:00'}
                          onChangeText={(value) => updateHoras(trabajador.id, value)}
                          keyboardType="default"
                          placeholder="0:00"
                        />
                        <TouchableOpacity
                          style={styles.guardarHorasButton}
                          onPress={() => handleGuardarHorasAsignadas(trabajador.id)}
                        >
                          <Text style={styles.guardarHorasButtonText}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.desasignarButton}
                      onPress={() => handleDesasignarTrabajador(trabajador.id, trabajador.nombre)}
                      accessibilityLabel="Desasignar trabajador"
                    >
                      <Ionicons name="close-outline" size={24} color={HoffColors.accentDark} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Editar tarea */}
          <View style={styles.secondaryActionWithIcon}>
            <Ionicons name="create-outline" size={22} color={HoffColors.textSecondary} />
            <TaskSecondaryButton label="Editar tarea" onPress={handleEditarTarea} style={styles.taskBtnFlex} />
          </View>

          {/* Cancelar tarea */}
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelarTarea}>
            <View style={styles.destructiveRow}>
              <Ionicons name="close-circle-outline" size={20} color={HoffColors.accentDark} />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancelar tarea</Text>
            </View>
          </TouchableOpacity>
        </TaskSection>
      )}

      {/* Acciones para estado asignada */}
      {esAsignada && (
        <TaskSection title="Acciones">
          
          {/* Asignar trabajadores adicionales */}
          <View style={styles.primaryActionWithIcon}>
            <Ionicons name="person-add-outline" size={22} color={HoffColors.primaryDark} />
            <TaskPrimaryButton
              label="Asignar trabajador"
              onPress={handleAbrirAsignarModal}
              style={styles.taskBtnFlex}
            />
          </View>

          {/* Desasignar trabajadores */}
          {tarea.trabajadores && tarea.trabajadores.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Trabajadores asignados:</Text>
              <Text style={styles.hoursHelp}>
                Ajusta las horas por persona (como máximo la duración de la tarea) y pulsa Guardar.
              </Text>
              {tarea.trabajadores.map((trabajador: any) => (
                <View key={trabajador.id} style={styles.trabajadorAsignadoBlock}>
                  <View style={styles.trabajadorAsignadoHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={styles.workerNameRow}>
                        <Ionicons name="construct-outline" size={18} color={HoffColors.primary} />
                        <Text style={styles.trabajadorAsignadoNombre}>{trabajador.nombre}</Text>
                      </View>
                      <Text style={styles.trabajadorHoras}>
                        {trabajador.horas_asignadas
                          ? `Asignadas: ${decimalATiempo(parseFloat(trabajador.horas_asignadas))}`
                          : tarea.numero_horas
                            ? `Por defecto: ${decimalATiempo(tarea.numero_horas)}`
                            : 'Sin horas en tarea'}
                      </Text>
                      <View style={styles.horasEdicionRow}>
                        <TextInput
                          style={styles.horasEdicionInput}
                          value={horasTiempoPorTrabajador[trabajador.id] || '0:00'}
                          onChangeText={(value) => updateHoras(trabajador.id, value)}
                          keyboardType="default"
                          placeholder="0:00"
                        />
                        <TouchableOpacity
                          style={styles.guardarHorasButton}
                          onPress={() => handleGuardarHorasAsignadas(trabajador.id)}
                        >
                          <Text style={styles.guardarHorasButtonText}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.desasignarButton}
                      onPress={() => handleDesasignarTrabajador(trabajador.id, trabajador.nombre)}
                      accessibilityLabel="Desasignar trabajador"
                    >
                      <Ionicons name="close-outline" size={24} color={HoffColors.accentDark} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Editar tarea */}
          <View style={styles.secondaryActionWithIcon}>
            <Ionicons name="create-outline" size={22} color={HoffColors.textSecondary} />
            <TaskSecondaryButton label="Editar tarea" onPress={handleEditarTarea} style={styles.taskBtnFlex} />
          </View>

          {/* Cancelar tarea */}
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelarTarea}>
            <View style={styles.destructiveRow}>
              <Ionicons name="close-circle-outline" size={20} color={HoffColors.accentDark} />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancelar tarea</Text>
            </View>
          </TouchableOpacity>
        </TaskSection>
      )}

      {/* Modal confirmar desasignar trabajador */}
      <Modal
        visible={showDesasignarModal && desasignarTarget != null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (desasignando) return;
          cerrarModalDesasignar();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Desasignar trabajador</Text>
            {desasignarTarget ? (
              <Text style={styles.modalSubtitle}>
                ¿Seguro que quieres quitar a{' '}
                <Text style={{ fontWeight: '700' }}>{desasignarTarget.nombre}</Text> de esta tarea? Dejará
                de verla en su lista asignada.
              </Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, desasignando && styles.modalConfirmButtonDisabled]}
                onPress={cerrarModalDesasignar}
                disabled={desasignando}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDestructiveButton,
                  desasignando && styles.modalConfirmButtonDisabled,
                ]}
                onPress={confirmarDesasignar}
                disabled={desasignando}
              >
                {desasignando ? (
                  <ActivityIndicator color={HoffColors.white} />
                ) : (
                  <Text style={styles.modalDestructiveText}>Desasignar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para asignar trabajador */}
      <Modal
        visible={showAsignarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (savingAsignacion) return;
          setShowAsignarModal(false);
          setTrabajadorSeleccionado(null);
          setHorasAsignar('0:00');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asignar Trabajador</Text>
            <Text style={styles.modalDraftHint}>
              Elige trabajador y horas aquí; los cambios se envían al servidor al pulsar Guardar. Cancelar cierra sin guardar.
            </Text>

            {loadingTrabajadores ? (
              <ActivityIndicator size="large" color={HoffColors.primary} style={{ marginVertical: 20 }} />
            ) : trabajadores.length === 0 ? (
              <Text style={styles.modalSubtitle}>
                No hay trabajadores disponibles para asignar
              </Text>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>Selecciona un trabajador:</Text>
                <ScrollView style={styles.trabajadoresList}>
                  {trabajadores.map((trabajador: any) => (
                    <TouchableOpacity
                      key={trabajador.id}
                      style={[
                        styles.trabajadorOption,
                        trabajadorSeleccionado === trabajador.id && styles.trabajadorOptionSelected
                      ]}
                      onPress={() => setTrabajadorSeleccionado(trabajador.id)}
                    >
                      <Text style={styles.trabajadorOptionText}>{trabajador.nombre}</Text>
                      {trabajadorSeleccionado === trabajador.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Horas asignadas (opcional):</Text>
                <TextInput
                  style={styles.hoursInput}
                  value={horasAsignar}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9:]/g, '');
                    if (validarFormatoTiempo(filtered) || filtered === '') {
                      setHorasAsignar(filtered || '0:00');
                    }
                  }}
                  placeholder="0:00"
                  keyboardType="default"
                />
                <Text style={styles.helpText}>
                  Por defecto se usa la duración de la tarea para este trabajador. Puedes indicar menos horas si aplica (nunca más que la duración).
                </Text>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, savingAsignacion && styles.modalConfirmButtonDisabled]} 
                onPress={() => {
                  if (savingAsignacion) return;
                  setShowAsignarModal(false);
                  setTrabajadorSeleccionado(null);
                  setHorasAsignar('0:00');
                }}
                disabled={savingAsignacion}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              {!loadingTrabajadores && trabajadores.length > 0 && (
                <TouchableOpacity 
                  style={[
                    styles.modalConfirmButton,
                    (!trabajadorSeleccionado || savingAsignacion) && styles.modalConfirmButtonDisabled,
                  ]} 
                  onPress={handleGuardarAsignacion}
                  disabled={!trabajadorSeleccionado || savingAsignacion}
                >
                  {savingAsignacion ? (
                    <ActivityIndicator color={HoffColors.white} />
                  ) : (
                    <Text style={styles.modalConfirmText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
    paddingBottom: taskSpacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HoffColors.background,
  },
  loadingText: {
    marginTop: 12,
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
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: HoffColors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 12,
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
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  financeLabel: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  financeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.primary,
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
  },
  clientTypeIcon: {
    marginRight: 6,
  },
  clientType: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  clientEmail: {
    fontSize: 14,
    color: HoffColors.textSecondary,
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
  detailInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
  tiempoServicioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateRow: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: HoffColors.text,
    textTransform: 'capitalize',
  },
  dateSmall: {
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
  },
  workerHours: {
    fontSize: 13,
    color: HoffColors.primary,
    marginTop: 4,
  },
  comentariosBox: {
    backgroundColor: HoffColors.secondaryMuted,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: HoffColors.accent,
  },
  comentariosText: {
    fontSize: 14,
    color: HoffColors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  hoursHelp: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  hoursAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  trabajadorNombre: {
    fontSize: 15,
    color: HoffColors.text,
    fontWeight: '500',
  },
  hoursInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hoursInput: {
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  hoursLabel: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    fontWeight: '600',
  },
  servicioTiempoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: HoffColors.secondaryMuted,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  servicioTiempoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.primary,
  },
  servicioTiempoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.primary,
  },
  servicioTiempoNote: {
    fontSize: 11,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  approvalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginBottom: 8,
  },
  notasInput: {
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  approveButton: {
    backgroundColor: HoffColors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  approveButtonDisabled: {
    opacity: 0.65,
  },
  approveButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryActionWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  secondaryActionWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  taskBtnFlex: {
    flex: 1,
  },
  warningInline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  approvalWarning: {
    flex: 1,
    fontSize: 12,
    color: HoffColors.accent,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: HoffColors.secondaryMuted,
    padding: 16,
    borderRadius: 12,
    alignItems: 'stretch',
    marginBottom: 12,
  },
  infoBoxInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoBoxText: {
    color: HoffColors.accent,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
  },
  approvedDate: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  notes: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  rechazoBox: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: HoffColors.accentDark,
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
  },
  devolverButton: {
    backgroundColor: HoffColors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  devolverButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  devolverHelp: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: HoffColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
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
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginBottom: 8,
  },
  mensajeInput: {
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
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: HoffColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalDraftHint: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: -4,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: HoffColors.accent,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  modalDestructiveButton: {
    flex: 1,
    backgroundColor: '#B71C1C',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDestructiveText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
    color: HoffColors.textSecondary,
    minWidth: 120,
  },
  aprobacionValue: {
    fontSize: 14,
    color: HoffColors.text,
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
    color: HoffColors.textSecondary,
    minWidth: 120,
  },
  cancelacionValue: {
    fontSize: 14,
    color: HoffColors.text,
    flex: 1,
  },
  nominaSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  nominaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  nominaLabel: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    fontWeight: '500',
  },
  nominaValue: {
    fontSize: 14,
    color: HoffColors.text,
    fontWeight: '600',
  },
  horasFinalesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  horaFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  horaFinalNombre: {
    fontSize: 14,
    color: HoffColors.text,
    fontWeight: '500',
  },
  horaFinalValor: {
    fontSize: 14,
    color: HoffColors.primary,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: HoffColors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: HoffColors.accent,
  },
  cancelButton: {
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.accentDark,
  },
  actionButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: HoffColors.accentDark,
  },
  trabajadorAsignadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  trabajadorAsignadoBlock: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  trabajadorAsignadoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  horasEdicionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  horasEdicionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    color: HoffColors.text,
    backgroundColor: '#fff',
  },
  guardarHorasButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: HoffColors.primary,
    borderRadius: 8,
  },
  guardarHorasButtonText: {
    color: HoffColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  trabajadorAsignadoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: HoffColors.text,
    flex: 1,
  },
  trabajadorHoras: {
    fontSize: 13,
    color: HoffColors.primary,
    fontWeight: 'normal',
    marginTop: 4,
  },
  desasignarButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: HoffColors.background,
  },
  desasignarButtonText: {
    fontSize: 16,
    color: HoffColors.accentDark,
  },
  trabajadoresList: {
    maxHeight: 200,
    marginVertical: 12,
  },
  trabajadorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trabajadorOptionSelected: {
    borderColor: HoffColors.primary,
    backgroundColor: HoffColors.secondaryMuted,
  },
  trabajadorOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: HoffColors.text,
  },
  checkmark: {
    fontSize: 18,
    color: HoffColors.primary,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 12,
  },
});

