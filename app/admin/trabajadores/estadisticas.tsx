import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { decimalATiempo } from '@/utils/tareas';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';

export default function EstadisticasTrabajadorScreen() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalHorasAprobadas, setTotalHorasAprobadas] = useState(0);
  const [tareasAprobadas, setTareasAprobadas] = useState<any[]>([]);
  const [totalTareasAprobadas, setTotalTareasAprobadas] = useState(0);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    loadEstadisticas();
  }, [id, mes, anio]);

  const loadEstadisticas = async () => {
    try {
      setLoading(true);

      const responseHoras = await api.getHorasTrabajadas(Number(id), mes, anio);
      if (responseHoras.success && responseHoras.data) {
        const extra = responseHoras as typeof responseHoras & { total_horas?: number };
        setTotalHorasAprobadas(extra.total_horas ?? 0);
      }

      const responseTareas = await api.getTareasAprobadas(Number(id), mes, anio);
      if (responseTareas.success && responseTareas.data) {
        setTareasAprobadas(responseTareas.data);
        const extraT = responseTareas as typeof responseTareas & { total_tareas?: number };
        setTotalTareasAprobadas(extraT.total_tareas ?? 0);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEstadisticas();
  };

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    if (direccion === 'anterior') {
      if (mes === 1) {
        setMes(12);
        setAnio(anio - 1);
      } else {
        setMes(mes - 1);
      }
    } else {
      if (mes === 12) {
        setMes(1);
        setAnio(anio + 1);
      } else {
        setMes(mes + 1);
      }
    }
  };

  if (loading) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  return (
    <TaskScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={HoffColors.primary}
            colors={[HoffColors.primary]}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Filtrar por período</Text>
          </View>

          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => cambiarMes('anterior')}
              accessibilityLabel="Mes anterior"
            >
              <Ionicons name="chevron-back" size={22} color={HoffColors.white} />
            </TouchableOpacity>

            <View style={styles.filtersContainer}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Mes</Text>
                <View style={styles.filterValueContainer}>
                  <Text style={styles.filterValue}>{meses[mes - 1]}</Text>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Año</Text>
                <View style={styles.filterValueContainer}>
                  <Text style={styles.filterValue}>{anio}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => cambiarMes('siguiente')}
              accessibilityLabel="Mes siguiente"
            >
              <Ionicons name="chevron-forward" size={22} color={HoffColors.white} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              const ahora = new Date();
              setMes(ahora.getMonth() + 1);
              setAnio(ahora.getFullYear());
            }}
          >
            <Ionicons name="today-outline" size={18} color={HoffColors.primary} style={styles.resetIcon} />
            <Text style={styles.resetButtonText}>Mes actual</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pie-chart-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Resumen del período</Text>
          </View>

          <View style={styles.resumenRow}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{totalTareasAprobadas}</Text>
              <Text style={styles.resumenLabel}>Tareas aprobadas</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{decimalATiempo(totalHorasAprobadas)}</Text>
              <Text style={styles.resumenLabel}>Horas aprobadas</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Tareas aprobadas del mes</Text>
          </View>

          {tareasAprobadas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hay tareas aprobadas para {meses[mes - 1]} {anio}
              </Text>
            </View>
          ) : (
            tareasAprobadas.map((tarea, index) => (
              <View key={index} style={styles.registroItem}>
                <View style={styles.registroHeader}>
                  <Text style={styles.registroFecha}>
                    {new Date(tarea.fecha_realizacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.registroHoras}>{decimalATiempo(parseFloat(tarea.horas_trabajadas))}</Text>
                </View>

                <Text style={styles.registroTarea} numberOfLines={2}>
                  {tarea.tarea_descripcion || 'Sin descripción'}
                </Text>

                <View style={styles.registroMetaRow}>
                  <Ionicons name="person-outline" size={14} color={HoffColors.textMuted} />
                  <Text style={styles.registroCliente}>{tarea.cliente_nombre || 'Cliente no disponible'}</Text>
                </View>

                {tarea.descripcion_horas ? (
                  <View style={styles.registroNotasRow}>
                    <Ionicons name="document-text-outline" size={14} color={HoffColors.textMuted} />
                    <Text style={styles.registroNotas} numberOfLines={2}>
                      {tarea.descripcion_horas}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.md,
    marginBottom: taskSpacing.md,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: taskRadius.sm,
    backgroundColor: HoffColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: taskSpacing.md,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.xs,
  },
  filterValueContainer: {
    backgroundColor: HoffColors.background,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  filterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
  },
  resetButton: {
    backgroundColor: HoffColors.background,
    padding: taskSpacing.md,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  resetIcon: {
    marginRight: taskSpacing.xs,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.primary,
  },
  resumenRow: {
    flexDirection: 'row',
    gap: taskSpacing.lg,
  },
  resumenItem: {
    flex: 1,
    backgroundColor: HoffColors.background,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  resumenValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: HoffColors.primary,
    marginBottom: taskSpacing.xs,
  },
  resumenLabel: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: HoffColors.textMuted,
    textAlign: 'center',
  },
  registroItem: {
    padding: taskSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  registroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: taskSpacing.sm,
  },
  registroFecha: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
  },
  registroHoras: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.primary,
  },
  registroTarea: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.xs,
  },
  registroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.xs,
    marginTop: taskSpacing.xs,
  },
  registroCliente: {
    fontSize: 12,
    color: HoffColors.textMuted,
    flex: 1,
  },
  registroNotasRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: taskSpacing.xs,
    marginTop: taskSpacing.xs,
    paddingLeft: taskSpacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: HoffColors.border,
  },
  registroNotas: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
});
