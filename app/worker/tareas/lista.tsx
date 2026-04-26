import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import api, { Tarea } from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import {
  getTaskListCardLayout,
  taskContentMaxWidth,
  taskSpacing,
  taskToolbarStrip,
  taskToolbarColumn,
} from '@/constants/taskUi';
import { workerListaEstadoColor } from '@/constants/taskEstadoColors';
import {
  AnimatedTaskCard,
  StatusPill,
  TaskSearchField,
  TaskFilterChipRow,
  TaskFiltersPanel,
  type TaskFilterChipItem,
} from '@/components/tareas';

type FilterTab = 'hoy' | 'pendientes' | 'completadas';

export default function ListaTareasScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { cardWidth } = getTaskListCardLayout(windowWidth);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('hoy');
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [draftActiveFilter, setDraftActiveFilter] = useState<FilterTab>('hoy');
  const listInFlightRef = useRef(false);

  const loadTareas = useCallback(async () => {
    if (listInFlightRef.current) return;
    listInFlightRef.current = true;
    try {
      if (user?.id) {
        const response = await api.getTareasByTrabajador(user.id);
        if (response.success && response.data) {
          setTareas(response.data);
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
      listInFlightRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    loadTareas();
  }, [loadTareas]);

  useFocusEffect(
    useCallback(() => {
      loadTareas();
    }, [loadTareas])
  );

  const applyFilters = useCallback(() => {
    let filtered = [...tareas];

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.descripcion_general?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.direccion_completa?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tab
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeFilter) {
      case 'hoy':
        filtered = filtered.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate.getTime() === today.getTime() && t.estado !== 'completada';
        });
        break;
      case 'pendientes':
        filtered = filtered.filter(
          (t) => t.estado === 'pendiente' || t.estado === 'asignada'
        );
        break;
      case 'completadas':
        filtered = filtered.filter((t) => t.estado === 'completada');
        break;
    }

    setFilteredTareas(filtered);
  }, [activeFilter, searchQuery, tareas]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTareas();
  }, [loadTareas]);

  const openFilters = () => {
    setDraftSearchQuery(searchQuery);
    setDraftActiveFilter(activeFilter);
    setPanelOpen(true);
  };

  const applyDraftFilters = () => {
    setSearchQuery(draftSearchQuery);
    setActiveFilter(draftActiveFilter);
    setPanelOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftSearchQuery('');
    setDraftActiveFilter('hoy');
  };

  const getEstadoText = (estado: string, fecha: string) => {
    const tareaDate = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tareaDate.setHours(0, 0, 0, 0);

    if (estado === 'aprobada') return 'Aprobada';
    if (estado === 'completada') return 'En revisión';
    if (estado === 'cancelada') return 'Cancelada';
    if (tareaDate < today && estado !== 'aprobada' && estado !== 'completada') return 'Vencida';
    if (tareaDate.getTime() === today.getTime()) return 'Hoy';
    return 'Asignada';
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tareaDate = new Date(date);
    tareaDate.setHours(0, 0, 0, 0);

    if (tareaDate.getTime() === today.getTime()) return 'Hoy';

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tareaDate.getTime() === tomorrow.getTime()) return 'Mañana';

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const getTabCount = (filter: FilterTab) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'hoy':
        return tareas.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate.getTime() === today.getTime() && t.estado !== 'completada';
        }).length;
      case 'pendientes':
        return tareas.filter(
          (t) => t.estado === 'pendiente' || t.estado === 'asignada'
        ).length;
      case 'completadas':
        return tareas.filter((t) => t.estado === 'completada').length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando tareas...</Text>
      </View>
    );
  }

  const filterChips: TaskFilterChipItem[] = [
    {
      key: 'hoy',
      label: `Hoy (${getTabCount('hoy')})`,
      active: activeFilter === 'hoy',
      onPress: () => setActiveFilter('hoy'),
    },
    {
      key: 'pendientes',
      label: `Pendientes (${getTabCount('pendientes')})`,
      active: activeFilter === 'pendientes',
      onPress: () => setActiveFilter('pendientes'),
    },
    {
      key: 'completadas',
      label: `Completadas (${getTabCount('completadas')})`,
      active: activeFilter === 'completadas',
      onPress: () => setActiveFilter('completadas'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={taskToolbarStrip}>
        <View style={[taskToolbarColumn, styles.toolbarInner]}>
          <TouchableOpacity style={styles.filtersButton} onPress={openFilters}>
            <Ionicons name="options-outline" size={16} color={HoffColors.primary} />
            <Text style={styles.filtersButtonText}>Filtros</Text>
            {(searchQuery.trim().length > 0 || activeFilter !== 'hoy') && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Activos</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.filtersSummary}>
            {searchQuery.trim().length > 0
              ? `Busqueda: "${searchQuery.trim()}"`
              : activeFilter === 'hoy'
              ? 'Sin filtros aplicados'
              : `Estado: ${activeFilter}`}
          </Text>
        </View>
      </View>

      <TaskFiltersPanel
        visible={panelOpen}
        onClose={() => setPanelOpen(false)}
        onApply={applyDraftFilters}
        onReset={resetDraftFilters}
      >
        <TaskSearchField
          placeholder="Buscar tareas..."
          value={draftSearchQuery}
          onChangeText={setDraftSearchQuery}
        />
        <TaskFilterChipRow
          chips={filterChips.map((chip) => ({
            ...chip,
            active: draftActiveFilter === (chip.key as FilterTab),
            onPress: () => setDraftActiveFilter(chip.key as FilterTab),
          }))}
        />
      </TaskFiltersPanel>

      {/* Lista de tareas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HoffColors.primary} />
        }
      >
        {filteredTareas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={HoffColors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyStateTitle}>No hay tareas</Text>
            <Text style={styles.emptyStateSubtitle}>
              {activeFilter === 'hoy' && 'No tienes tareas para hoy'}
              {activeFilter === 'pendientes' && 'No tienes tareas pendientes'}
              {activeFilter === 'completadas' && 'Aún no has completado tareas'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTareas.map((tarea, index) => {
              const estadoBg = workerListaEstadoColor(tarea.estado, tarea.fecha_realizacion);
              const estadoLabel = getEstadoText(tarea.estado, tarea.fecha_realizacion);
              return (
                <AnimatedTaskCard
                  key={tarea.id}
                  index={index}
                  style={{ width: cardWidth }}
                  onPress={() => router.push(`/worker/tareas/detalle?id=${tarea.id}`)}
                >
                  <StatusPill label={estadoLabel} backgroundColor={estadoBg} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {tarea.cliente_nombre}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {tarea.descripcion_general}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.cardMetaRow}>
                      <Ionicons name="calendar-outline" size={14} color={HoffColors.textSecondary} />
                      <Text style={styles.cardDate}>{formatFecha(tarea.fecha_realizacion)}</Text>
                    </View>
                    <Text style={styles.detailsButtonText}>Más detalles</Text>
                  </View>
                </AnimatedTaskCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  toolbarInner: {
    paddingTop: taskSpacing.lg,
    paddingBottom: taskSpacing.lg,
    gap: taskSpacing.md,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: taskSpacing.lg,
    maxWidth: taskContentMaxWidth,
    width: '100%' as const,
    alignSelf: 'center',
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: taskSpacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 4,
    marginTop: taskSpacing.md,
  },
  cardDescription: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.sm,
    minHeight: 36,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: taskSpacing.sm,
  },
  cardDate: {
    fontSize: 12,
    color: HoffColors.textSecondary,
  },
  detailsButtonText: {
    fontSize: 13,
    color: HoffColors.accentDark,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: taskSpacing.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: taskSpacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    textAlign: 'center',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: taskSpacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HoffColors.primary,
    backgroundColor: HoffColors.primarySoft,
    paddingHorizontal: taskSpacing.md,
    paddingVertical: taskSpacing.sm,
  },
  filtersButtonText: {
    color: HoffColors.primary,
    fontWeight: '700',
  },
  activeBadge: {
    marginLeft: taskSpacing.xs,
    backgroundColor: HoffColors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: HoffColors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  filtersSummary: {
    fontSize: 12,
    color: HoffColors.textSecondary,
  },
});
