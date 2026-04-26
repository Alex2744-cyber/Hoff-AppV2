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
import { taskEstadoColors } from '@/constants/taskEstadoColors';
import {
  AnimatedTaskCard,
  StatusPill,
  TaskSearchField,
  TaskFilterChipRow,
  TaskFiltersPanel,
  type TaskFilterChipItem,
} from '@/components/tareas';

type FilterDate = 'todas' | 'hoy' | 'semana' | 'mes';

export default function TareasCompletadasScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { cardWidth } = getTaskListCardLayout(windowWidth);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<FilterDate>('todas');
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [draftDateFilter, setDraftDateFilter] = useState<FilterDate>('todas');
  const listInFlightRef = useRef(false);

  const loadTareas = useCallback(async () => {
    if (listInFlightRef.current) return;
    listInFlightRef.current = true;
    try {
      if (user?.id) {
        const response = await api.getTareasByTrabajador(user.id);
        if (response.success && response.data) {
          // Filtrar solo tareas completadas
          const completadas = response.data.filter((t: Tarea) => t.estado === 'completada');
          setTareas(completadas);
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las tareas completadas');
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

    // Filtro por fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'hoy':
        filtered = filtered.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate.getTime() === today.getTime();
        });
        break;
      case 'semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate >= weekAgo && tareaDate <= today;
        });
        break;
      case 'mes':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate >= monthAgo && tareaDate <= today;
        });
        break;
      case 'todas':
        // Mostrar todas
        break;
    }

    setFilteredTareas(filtered);
  }, [dateFilter, searchQuery, tareas]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTareas();
  }, [loadTareas]);

  const openFilters = () => {
    setDraftSearchQuery(searchQuery);
    setDraftDateFilter(dateFilter);
    setPanelOpen(true);
  };

  const applyDraftFilters = () => {
    setSearchQuery(draftSearchQuery);
    setDateFilter(draftDateFilter);
    setPanelOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftSearchQuery('');
    setDraftDateFilter('todas');
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDateFilterCount = (filter: FilterDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'hoy':
        return tareas.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate.getTime() === today.getTime();
        }).length;
      case 'semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tareas.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate >= weekAgo && tareaDate <= today;
        }).length;
      case 'mes':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return tareas.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate >= monthAgo && tareaDate <= today;
        }).length;
      case 'todas':
        return tareas.length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando tareas completadas...</Text>
      </View>
    );
  }

  const dateChips: TaskFilterChipItem[] = [
    {
      key: 'todas',
      label: `Todas (${getDateFilterCount('todas')})`,
      active: dateFilter === 'todas',
      onPress: () => setDateFilter('todas'),
    },
    {
      key: 'hoy',
      label: `Hoy (${getDateFilterCount('hoy')})`,
      active: dateFilter === 'hoy',
      onPress: () => setDateFilter('hoy'),
    },
    {
      key: 'semana',
      label: `Esta semana (${getDateFilterCount('semana')})`,
      active: dateFilter === 'semana',
      onPress: () => setDateFilter('semana'),
    },
    {
      key: 'mes',
      label: `Este mes (${getDateFilterCount('mes')})`,
      active: dateFilter === 'mes',
      onPress: () => setDateFilter('mes'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={taskToolbarStrip}>
        <View style={[taskToolbarColumn, styles.toolbarInner]}>
          <TouchableOpacity style={styles.filtersButton} onPress={openFilters}>
            <Ionicons name="options-outline" size={16} color={HoffColors.primary} />
            <Text style={styles.filtersButtonText}>Filtros</Text>
            {(searchQuery.trim().length > 0 || dateFilter !== 'todas') && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Activos</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.filtersSummary}>
            {searchQuery.trim().length > 0 || dateFilter !== 'todas' ? 'Filtros aplicados' : 'Sin filtros aplicados'}
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
          placeholder="Buscar tareas completadas..."
          value={draftSearchQuery}
          onChangeText={setDraftSearchQuery}
        />
        <TaskFilterChipRow
          chips={dateChips.map((chip) => ({
            ...chip,
            active: draftDateFilter === (chip.key as FilterDate),
            onPress: () => setDraftDateFilter(chip.key as FilterDate),
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
            <Ionicons name="checkmark-done-outline" size={48} color={HoffColors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyStateTitle}>No hay tareas completadas</Text>
            <Text style={styles.emptyStateSubtitle}>
              {dateFilter === 'todas' && 'Aún no has completado ninguna tarea'}
              {dateFilter === 'hoy' && 'No completaste tareas hoy'}
              {dateFilter === 'semana' && 'No completaste tareas esta semana'}
              {dateFilter === 'mes' && 'No completaste tareas este mes'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTareas.map((tarea, index) => (
              <AnimatedTaskCard
                key={tarea.id}
                index={index}
                style={{ width: cardWidth }}
                onPress={() => router.push(`/worker/tareas/detalle?id=${tarea.id}`)}
              >
                <StatusPill label="En revisión" backgroundColor={taskEstadoColors.porAprobar} />
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
            ))}
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

