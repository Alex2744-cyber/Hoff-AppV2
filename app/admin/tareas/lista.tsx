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
import api, { Tarea } from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import {
  getTaskListCardLayout,
  taskContentMaxWidth,
  taskSpacing,
  taskToolbarStrip,
  taskToolbarColumn,
} from '@/constants/taskUi';
import { adminListaEstadoColor } from '@/constants/taskEstadoColors';
import {
  AnimatedTaskCard,
  StatusPill,
  TaskSearchField,
  TaskFilterChipRow,
  TaskFiltersPanel,
  type TaskFilterChipItem,
} from '@/components/tareas';

type FilterTab = 'todas' | 'sin_asignar' | 'en_curso';

export default function ListaTareasScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { cardWidth } = getTaskListCardLayout(windowWidth);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todas');
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [draftActiveFilter, setDraftActiveFilter] = useState<FilterTab>('todas');
  const listInFlightRef = useRef(false);

  const loadTareas = useCallback(async () => {
    if (listInFlightRef.current) return;
    listInFlightRef.current = true;
    try {
      const response = await api.getTareas();
      if (response.success && response.data) {
        setTareas(response.data);
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
      listInFlightRef.current = false;
    }
  }, []);

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
          t.direccion_completa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.trabajadores_asignados?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tab
    switch (activeFilter) {
      case 'todas':
        // Mostrar todas
        break;
      case 'sin_asignar':
        filtered = filtered.filter(
          (t) => t.estado === 'pendiente' && !t.trabajadores_asignados
        );
        break;
      case 'en_curso':
        filtered = filtered.filter((t) => t.estado === 'asignada');
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
    setDraftActiveFilter('todas');
  };

  const getEstadoText = (estado: string, trabajadores: string | null) => {
    if (estado === 'aprobada') return 'Aprobada';
    if (estado === 'completada') return 'Por aprobar';
    if (estado === 'pendiente' && !trabajadores) return 'Sin asignar';
    if (estado === 'asignada') return 'Asignada';
    if (estado === 'cancelada') return 'Cancelada';
    return estado;
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
    switch (filter) {
      case 'todas':
        return tareas.length;
      case 'sin_asignar':
        return tareas.filter((t) => t.estado === 'pendiente' && !t.trabajadores_asignados).length;
      case 'en_curso':
        return tareas.filter((t) => t.estado === 'asignada').length;
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
      key: 'todas',
      label: `Todas (${getTabCount('todas')})`,
      active: activeFilter === 'todas',
      onPress: () => setActiveFilter('todas'),
    },
    {
      key: 'sin_asignar',
      label: `Sin asignar (${getTabCount('sin_asignar')})`,
      active: activeFilter === 'sin_asignar',
      onPress: () => setActiveFilter('sin_asignar'),
    },
    {
      key: 'en_curso',
      label: `En curso (${getTabCount('en_curso')})`,
      active: activeFilter === 'en_curso',
      onPress: () => setActiveFilter('en_curso'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={taskToolbarStrip}>
        <View style={[taskToolbarColumn, styles.toolbarInner]}>
          <TouchableOpacity style={styles.filtersButton} onPress={openFilters}>
            <Ionicons name="options-outline" size={16} color={HoffColors.primary} />
            <Text style={styles.filtersButtonText}>Filtros</Text>
            {(searchQuery.trim().length > 0 || activeFilter !== 'todas') && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Activos</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.filtersSummary}>
            {searchQuery.trim().length > 0
              ? `Busqueda: "${searchQuery.trim()}"`
              : activeFilter === 'todas'
              ? 'Sin filtros aplicados'
              : `Estado: ${activeFilter === 'sin_asignar' ? 'Sin asignar' : 'En curso'}`}
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
              {activeFilter === 'todas' && 'No hay tareas registradas'}
              {activeFilter === 'sin_asignar' && 'No hay tareas sin asignar'}
              {activeFilter === 'en_curso' && 'No hay tareas en curso'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTareas.map((tarea, index) => {
              const estadoBg = adminListaEstadoColor(
                tarea.estado,
                tarea.fecha_realizacion,
                tarea.trabajadores_asignados ?? null
              );
              const estadoLabel = getEstadoText(tarea.estado, tarea.trabajadores_asignados ?? null);
              return (
                <AnimatedTaskCard
                  key={tarea.id}
                  index={index}
                  style={{ width: cardWidth }}
                  onPress={() => router.push(`/admin/tareas/detalle?id=${tarea.id}`)}
                >
                  <StatusPill label={estadoLabel} backgroundColor={estadoBg} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {tarea.cliente_nombre}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {tarea.descripcion_general}
                  </Text>
                  {tarea.trabajadores_asignados ? (
                    <View style={styles.cardMetaRow}>
                      <Ionicons name="person-outline" size={14} color={HoffColors.primary} />
                      <Text style={styles.cardWorker} numberOfLines={1}>
                        {tarea.trabajadores_asignados}
                      </Text>
                    </View>
                  ) : null}
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
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: taskSpacing.sm,
  },
  cardWorker: {
    flex: 1,
    fontSize: 12,
    color: HoffColors.primary,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 'auto',
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
