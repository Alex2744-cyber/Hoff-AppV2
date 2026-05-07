import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskShadowCard, taskSpacing } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';

function dateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function contratoBadgeStyle(estado: string) {
  const normalized = String(estado || '').toLowerCase();
  if (normalized === 'pagado') return { bg: 'rgba(46,125,50,0.12)', border: '#2E7D32', text: '#2E7D32' };
  if (normalized === 'cerrado') return { bg: 'rgba(245,124,0,0.12)', border: '#F57C00', text: '#F57C00' };
  return { bg: 'rgba(10,66,50,0.1)', border: HoffColors.primary, text: HoffColors.primary };
}

export default function ContratoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<any | null>(null);
  const [savingDates, setSavingDates] = useState(false);
  const [manualDates, setManualDates] = useState<string[]>([]);
  const [descripcionGeneral, setDescripcionGeneral] = useState('');
  const [detallesEspecificos, setDetallesEspecificos] = useState('');
  const [numeroHoras, setNumeroHoras] = useState('');

  const loadContrato = async () => {
    try {
      setLoading(true);
      const res = await api.getContratoById(Number(id));
      setContrato(res.success ? res.data : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContrato();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (contrato) {
      setDescripcionGeneral(contrato.descripcion_contrato || '');
    }
  }, [contrato]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const d of manualDates) {
      marks[d] = {
        selected: true,
        selectedColor: HoffColors.primary,
        selectedTextColor: '#fff',
      };
    }
    return marks;
  }, [manualDates]);

  const onAddTareas = async () => {
    if (!contrato) return;
    const fechas = manualDates;
    if (fechas.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una fecha');
      return;
    }
    if (!descripcionGeneral.trim()) {
      Alert.alert('Error', 'Debes indicar una descripción general');
      return;
    }
    setSavingDates(true);
    try {
      const res = await api.createContratoTareas(Number(contrato.id), {
        cliente_id: Number(contrato.cliente_id),
        direccion_id: Number(contrato.direccion_id),
        descripcion_general: descripcionGeneral.trim(),
        detalles_especificos: detallesEspecificos.trim() || null,
        numero_horas: numeroHoras.trim() ? Number(numeroHoras) : null,
        fechas,
      });
      if (res.success) {
        setManualDates([]);
        Alert.alert('OK', `Se añadieron ${res.data?.total ?? fechas.length} tareas al contrato.`);
        await loadContrato();
      } else {
        Alert.alert('Error', res.error || 'No se pudieron agregar tareas');
      }
    } finally {
      setSavingDates(false);
    }
  };

  const onRemoveTarea = async (tareaId: number) => {
    if (!contrato) return;
    Alert.alert(
      'Quitar tarea',
      'Se eliminará la tarea solo si está pendiente/asignada y sin evidencias.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const res = await api.removeContratoTarea(Number(contrato.id), tareaId);
            if (res.success) {
              await loadContrato();
            } else {
              Alert.alert('No se puede quitar', res.error || 'No se pudo quitar la tarea');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <TaskScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color={HoffColors.primary} />
        </View>
      </TaskScreenContainer>
    );
  }

  if (!contrato) {
    return (
      <TaskScreenContainer>
        <View style={styles.loading}>
          <Text style={styles.meta}>Contrato no encontrado</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  return (
    <TaskScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.contractHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Resumen del contrato</Text>
              <Text style={styles.title}>Contrato #{contrato.id}</Text>
              <Text style={styles.meta}>{contrato.descripcion_contrato || 'Sin descripción'}</Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: contratoBadgeStyle(contrato.estado).bg,
                  borderColor: contratoBadgeStyle(contrato.estado).border,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: contratoBadgeStyle(contrato.estado).text }]}>
                {String(contrato.estado).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoTile}>
              <Text style={styles.infoValue}>€{Number(contrato.valor_contrato || 0).toFixed(2)}</Text>
              <Text style={styles.infoLabel}>Valor contrato</Text>
            </View>
            <View style={styles.infoTile}>
              <Text style={styles.infoValue}>{Number(contrato.tareas?.length || 0)}</Text>
              <Text style={styles.infoLabel}>Tareas vinculadas</Text>
            </View>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push(`/admin/contratos/editar?id=${contrato.id}`)}>
              <Text style={styles.secondaryBtnText}>Editar contrato</Text>
            </TouchableOpacity>
            {contrato.estado !== 'pagado' && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={async () => {
                  const res = await api.pagarContrato(contrato.id, {});
                  if (res.success) {
                    const refreshed = await api.getContratoById(contrato.id);
                    setContrato(refreshed.data);
                  }
                }}
              >
                <Text style={styles.payBtnText}>Marcar pagado</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Gestión de tareas</Text>
          <Text style={styles.title}>Agregar tareas al contrato</Text>
          <Text style={styles.meta}>Selecciona los días manualmente: {manualDates.length}</Text>
          <Calendar
            current={dateToYmd(new Date())}
            minDate={dateToYmd(new Date())}
            markedDates={markedDates}
            onDayPress={(day) => {
              const picked = day.dateString;
              setManualDates((prev) => (prev.includes(picked) ? prev.filter((d) => d !== picked) : [...prev, picked].sort()));
            }}
            theme={{
              todayTextColor: HoffColors.primary,
              arrowColor: HoffColors.primary,
              selectedDayBackgroundColor: HoffColors.primary,
              selectedDayTextColor: '#fff',
            }}
            enableSwipeMonths
          />
          <TextInput
            style={styles.input}
            placeholder="Descripción general de las tareas"
            value={descripcionGeneral}
            onChangeText={setDescripcionGeneral}
          />
          <TextInput
            style={styles.input}
            placeholder="Detalles específicos (opcional)"
            value={detallesEspecificos}
            onChangeText={setDetallesEspecificos}
          />
          <TextInput
            style={styles.input}
            placeholder="Horas estimadas (opcional)"
            value={numeroHoras}
            onChangeText={setNumeroHoras}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={[styles.payBtn, savingDates && styles.disabledBtn]} disabled={savingDates} onPress={onAddTareas}>
            <Text style={styles.payBtnText}>{savingDates ? 'Agregando...' : 'Agregar tareas'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Listado</Text>
          <Text style={styles.title}>Tareas vinculadas</Text>
          {(contrato.tareas || []).map((t: any) => (
            <View key={t.id} style={styles.taskRow}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/admin/tareas/detalle?id=${t.id}`)}>
                <Text style={styles.meta}>#{t.id} · {t.fecha_realizacion} · {t.estado}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemoveTarea(Number(t.id))}>
                <Text style={styles.removeBtnText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: taskSpacing.xl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    marginBottom: taskSpacing.md,
    padding: taskSpacing.md,
    borderRadius: taskRadius.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    backgroundColor: HoffColors.surface,
    ...taskShadowCard,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: HoffColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: taskSpacing.xs,
  },
  title: { fontSize: 16, fontWeight: '700', color: HoffColors.text },
  meta: { marginTop: 4, fontSize: 13, color: HoffColors.textSecondary },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: taskSpacing.sm,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: taskSpacing.sm,
    marginTop: taskSpacing.md,
  },
  infoTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.background,
    padding: taskSpacing.sm,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '800',
    color: HoffColors.primary,
  },
  infoLabel: {
    marginTop: 2,
    fontSize: 11,
    color: HoffColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: taskSpacing.sm,
    marginTop: taskSpacing.md,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    paddingVertical: taskSpacing.sm,
    alignItems: 'center',
    backgroundColor: HoffColors.background,
  },
  secondaryBtnText: {
    color: HoffColors.textSecondary,
    fontWeight: '700',
  },
  disabledBtn: { opacity: 0.6 },
  payBtn: {
    flex: 1,
    backgroundColor: HoffColors.primary,
    paddingVertical: taskSpacing.sm,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
  },
  payBtnText: { color: HoffColors.white, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    marginTop: taskSpacing.sm,
    color: HoffColors.text,
    backgroundColor: HoffColors.surface,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
    marginTop: taskSpacing.xs,
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: '#C62828',
    backgroundColor: 'rgba(198,40,40,0.08)',
    borderRadius: taskRadius.sm,
    paddingHorizontal: taskSpacing.md,
    paddingVertical: taskSpacing.xs,
  },
  removeBtnText: {
    color: '#C62828',
    fontWeight: '700',
    fontSize: 12,
  },
});
