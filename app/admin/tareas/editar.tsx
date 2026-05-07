import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer, TaskSection, InfoModal } from '@/components/tareas';
import { decimalATiempo, tiempoADecimal, validarFormatoTiempo } from '@/utils/tareas';

export default function EditarTareaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  ) => {
    setInfoModal({ visible: true, title, message, variant, onClose });
  };

  const closeInfoModal = () => {
    const cb = infoModal.onClose;
    setInfoModal((prev) => ({ ...prev, visible: false, onClose: undefined }));
    if (cb) cb();
  };

  const [clienteNombre, setClienteNombre] = useState('');
  const [direccionTexto, setDireccionTexto] = useState('');
  const [fechaRealizacion, setFechaRealizacion] = useState<Date>(new Date());
  const [descripcionGeneral, setDescripcionGeneral] = useState('');
  const [detallesEspecificos, setDetallesEspecificos] = useState('');
  const [horasEstimadasStr, setHorasEstimadasStr] = useState('0:00');
  const [valorServicio, setValorServicio] = useState('');

  const isFirstFocusRef = useRef(true);
  useEffect(() => {
    isFirstFocusRef.current = true;
  }, [id]);

  const loadTarea = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!id) {
      openInfoModal('Error', 'Falta el identificador de la tarea', 'error', () => router.back());
      return;
    }

    try {
      if (!silent) setLoading(true);
      const response = await api.getTareaById(Number(id));
      if (!response.success || !response.data) {
        openInfoModal('Error', 'No se pudo cargar la tarea', 'error', () => router.back());
        return;
      }

      const t = response.data as any;
      if (t.estado !== 'pendiente' && t.estado !== 'asignada') {
        openInfoModal(
          'No editable',
          'Solo se pueden editar tareas en estado pendiente o asignada.',
          'warning',
          () => router.back()
        );
        return;
      }

      setClienteNombre(t.cliente_nombre || '');
      const dir = [t.direccion_completa, t.ciudad].filter(Boolean).join(', ');
      setDireccionTexto(dir);

      const fd = new Date(t.fecha_realizacion);
      setFechaRealizacion(isNaN(fd.getTime()) ? new Date() : fd);
      setDescripcionGeneral(t.descripcion_general || '');
      setDetallesEspecificos(t.detalles_especificos != null ? String(t.detalles_especificos) : '');

      const nh = t.numero_horas != null ? parseFloat(String(t.numero_horas)) : 0;
      setHorasEstimadasStr(decimalATiempo(isNaN(nh) ? 0 : nh));

      const vs = t.valor_servicio != null ? parseFloat(String(t.valor_servicio)) : 0;
      setValorServicio(isNaN(vs) ? '' : String(vs));
    } catch {
      openInfoModal('Error', 'No se pudo cargar la tarea', 'error', () => router.back());
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      const silent = !isFirstFocusRef.current;
      isFirstFocusRef.current = false;
      void loadTarea({ silent });
    }, [loadTarea])
  );

  const handleSubmit = async () => {
    if (!id) return;

    if (!descripcionGeneral.trim() || !valorServicio.trim()) {
      openInfoModal('Error', 'Completa la descripción y el valor del servicio', 'error');
      return;
    }

    if (isNaN(parseFloat(valorServicio)) || parseFloat(valorServicio) <= 0) {
      openInfoModal('Error', 'El valor del servicio debe ser un número mayor a 0', 'error');
      return;
    }

    if (horasEstimadasStr.trim() && !validarFormatoTiempo(horasEstimadasStr.trim())) {
      openInfoModal(
        'Error',
        'Las horas estimadas deben tener formato H:MM o HH:MM (ej. 2:30)',
        'error'
      );
      return;
    }

    const horasDecimal = tiempoADecimal(horasEstimadasStr.trim());

    const payload: Record<string, unknown> = {
      fecha_realizacion: fechaRealizacion.toISOString().split('T')[0],
      descripcion_general: descripcionGeneral.trim(),
      detalles_especificos: detallesEspecificos.trim(),
      valor_servicio: parseFloat(valorServicio),
    };

    if (horasDecimal > 0) {
      payload.numero_horas = horasDecimal;
    } else {
      payload.numero_horas = null;
    }

    setSaving(true);
    try {
      const response = await api.updateTarea(Number(id), payload);
      if (response.success) {
        openInfoModal('Guardado', 'La tarea se ha actualizado correctamente', 'success', () => router.back());
      }
    } catch (error: any) {
      openInfoModal('Error', error.message || 'No se pudo guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando tarea...</Text>
      </View>
    );
  }

  const fechaKey = fechaRealizacion.toISOString().split('T')[0];

  return (
    <TaskScreenContainer bottomInsetExtra={32}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TaskSection title="Cliente">
        <Text style={styles.readOnlyText}>{clienteNombre || '—'}</Text>
      </TaskSection>

      <TaskSection title="Dirección">
        <Text style={styles.readOnlyText}>{direccionTexto || '—'}</Text>
        <Text style={styles.helperText}>
          El cliente y la dirección no se pueden cambiar desde aquí (solo datos del trabajo).
        </Text>
      </TaskSection>

      <TaskSection title="Fecha de realización *">
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>
            {fechaRealizacion.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalContent}>
              <Text style={styles.dateModalTitle}>Seleccionar fecha</Text>
              <Calendar
                current={fechaKey}
                onDayPress={(day) => {
                  setFechaRealizacion(new Date(day.dateString));
                  setShowDatePicker(false);
                }}
                markedDates={{
                  [fechaKey]: {
                    selected: true,
                    selectedColor: HoffColors.primary,
                    selectedTextColor: '#fff',
                  },
                }}
                theme={{
                  todayTextColor: HoffColors.primary,
                  arrowColor: HoffColors.primary,
                  selectedDayBackgroundColor: HoffColors.primary,
                  selectedDayTextColor: '#fff',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                }}
                enableSwipeMonths
              />
              <TouchableOpacity style={styles.dateModalButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.dateModalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </TaskSection>

      <TaskSection title="Descripción del trabajo *">
        <TextInput
          style={styles.textArea}
          placeholder="Describe el trabajo..."
          multiline
          numberOfLines={4}
          value={descripcionGeneral}
          onChangeText={setDescripcionGeneral}
          textAlignVertical="top"
        />
      </TaskSection>

      <TaskSection title="Detalles específicos (opcional)">
        <TextInput
          style={styles.textArea}
          placeholder="Instrucciones adicionales..."
          multiline
          numberOfLines={3}
          value={detallesEspecificos}
          onChangeText={setDetallesEspecificos}
          textAlignVertical="top"
        />
      </TaskSection>

      <TaskSection title="Horas estimadas (opcional)">
        <TextInput
          style={styles.input}
          placeholder="0:00"
          value={horasEstimadasStr}
          onChangeText={setHorasEstimadasStr}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <Text style={styles.helperText}>Formato H:MM o HH:MM (ej. 2:30). Vacío o 0:00 borra el total.</Text>
      </TaskSection>

      <TaskSection title="Valor del servicio (€) *">
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={valorServicio}
          onChangeText={setValorServicio}
        />
      </TaskSection>

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
  helperText: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    marginTop: taskSpacing.sm,
  },
  readOnlyText: {
    fontSize: 16,
    color: HoffColors.text,
    lineHeight: 22,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 14,
    backgroundColor: HoffColors.background,
  },
  dateText: {
    fontSize: 16,
    color: HoffColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
  },
  textArea: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    minHeight: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: 16,
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
    padding: 16,
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
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalContent: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: 20,
    width: '95%',
    maxWidth: 400,
    ...taskShadowCard,
  },
  dateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: HoffColors.text,
  },
  dateModalButton: {
    backgroundColor: HoffColors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dateModalButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
