import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api, { Tarea, Trabajador } from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import {
  getTaskListCardLayout,
  taskContentMaxWidth,
  taskSpacing,
  taskToolbarStrip,
  taskToolbarColumn,
  taskFilterSectionLabel,
} from '@/constants/taskUi';
import {
  AnimatedTaskCard,
  StatusPill,
  TaskSearchField,
  TaskFilterChipRow,
  TaskFiltersPanel,
  InfoModal,
  type TaskFilterChipItem,
} from '@/components/tareas';

type FilterDate = 'todas' | 'hoy' | 'semana' | 'mes';

export default function TrabajosRealizadosScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { cardWidth } = getTaskListCardLayout(windowWidth);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<FilterDate>('todas');
  const [selectedTrabajador, setSelectedTrabajador] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [draftDateFilter, setDraftDateFilter] = useState<FilterDate>('todas');
  const [draftSelectedTrabajador, setDraftSelectedTrabajador] = useState<number | null>(null);
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
  const listInFlightRef = useRef(false);

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

  const loadTareas = useCallback(async () => {
    if (listInFlightRef.current) return;
    listInFlightRef.current = true;
    try {
      const response = await api.getTareas();
      if (response.success && response.data) {
        // Filtrar solo tareas aprobadas
        const aprobadas = response.data.filter((t: Tarea) => t.estado === 'aprobada');
        setTareas(aprobadas);
      }
    } catch {
      openInfoModal('Error', 'No se pudieron cargar los trabajos realizados', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      listInFlightRef.current = false;
    }
  }, []);

  const loadTrabajadores = useCallback(async () => {
    try {
      const response = await api.getTrabajadores();
      if (response.success && response.data) {
        setTrabajadores(response.data);
      }
    } catch {
      // Silenciar error, no es crítico
    }
  }, []);

  useEffect(() => {
    loadTareas();
    loadTrabajadores();
  }, [loadTareas, loadTrabajadores]);

  useFocusEffect(
    useCallback(() => {
      loadTareas();
      loadTrabajadores();
    }, [loadTareas, loadTrabajadores])
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

    // Filtro por trabajador (necesitamos verificar si el trabajador está asignado)
    if (selectedTrabajador) {
      const trabajador = trabajadores.find((t) => t.id === selectedTrabajador);
      if (trabajador) {
        filtered = filtered.filter((t) =>
          t.trabajadores_asignados?.toLowerCase().includes(trabajador.nombre.toLowerCase())
        );
      }
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
  }, [dateFilter, searchQuery, selectedTrabajador, tareas, trabajadores]);

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
    setDraftSelectedTrabajador(selectedTrabajador);
    setPanelOpen(true);
  };

  const applyDraftFilters = () => {
    setSearchQuery(draftSearchQuery);
    setDateFilter(draftDateFilter);
    setSelectedTrabajador(draftSelectedTrabajador);
    setPanelOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftSearchQuery('');
    setDraftDateFilter('todas');
    setDraftSelectedTrabajador(null);
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

    let baseTareas = [...tareas];
    
    // Aplicar filtro de trabajador si está seleccionado
    if (selectedTrabajador) {
      const trabajador = trabajadores.find((t) => t.id === selectedTrabajador);
      if (trabajador) {
        baseTareas = baseTareas.filter((t) =>
          t.trabajadores_asignados?.toLowerCase().includes(trabajador.nombre.toLowerCase())
        );
      }
    }

    switch (filter) {
      case 'hoy':
        return baseTareas.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate.getTime() === today.getTime();
        }).length;
      case 'semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return baseTareas.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate >= weekAgo && tareaDate <= today;
        }).length;
      case 'mes':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return baseTareas.filter((t) => {
          const tareaDate = new Date(t.fecha_realizacion);
          tareaDate.setHours(0, 0, 0, 0);
          return tareaDate >= monthAgo && tareaDate <= today;
        }).length;
      case 'todas':
        return baseTareas.length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando trabajos realizados...</Text>
      </View>
    );
  }

  const workerChips: TaskFilterChipItem[] = [
    {
      key: 'all',
      label: 'Todos',
      active: selectedTrabajador === null,
      onPress: () => setSelectedTrabajador(null),
    },
    ...trabajadores.map((trabajador) => ({
      key: `w-${trabajador.id}`,
      label: trabajador.nombre,
      active: selectedTrabajador === trabajador.id,
      onPress: () => setSelectedTrabajador(trabajador.id),
    })),
  ];

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
            {(searchQuery.trim().length > 0 || dateFilter !== 'todas' || selectedTrabajador !== null) && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Activos</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.filtersSummary}>
            {searchQuery.trim().length > 0 || dateFilter !== 'todas' || selectedTrabajador !== null
              ? 'Filtros aplicados'
              : 'Sin filtros aplicados'}
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
          placeholder="Buscar trabajos realizados..."
          value={draftSearchQuery}
          onChangeText={setDraftSearchQuery}
        />
        <Text style={taskFilterSectionLabel}>Filtrar por staff</Text>
        <TaskFilterChipRow
          chips={workerChips.map((chip) => ({
            ...chip,
            active: chip.key === 'all' ? draftSelectedTrabajador === null : draftSelectedTrabajador === Number(String(chip.key).replace('w-', '')),
            onPress: () => {
              if (chip.key === 'all') {
                setDraftSelectedTrabajador(null);
                return;
              }
              const id = Number(String(chip.key).replace('w-', ''));
              setDraftSelectedTrabajador(Number.isNaN(id) ? null : id);
            },
          }))}
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
            <Text style={styles.emptyStateTitle}>No hay trabajos realizados</Text>
            <Text style={styles.emptyStateSubtitle}>
              {dateFilter === 'todas' && 'No hay trabajos aprobados registrados'}
              {dateFilter === 'hoy' && 'No se aprobaron trabajos hoy'}
              {dateFilter === 'semana' && 'No se aprobaron trabajos esta semana'}
              {dateFilter === 'mes' && 'No se aprobaron trabajos este mes'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTareas.map((tarea, index) => (
              <AnimatedTaskCard
                key={tarea.id}
                index={index}
                style={{ width: cardWidth }}
                onPress={() => router.push(`/admin/tareas/detalle?id=${tarea.id}`)}
              >
                <StatusPill label="Trabajo realizado" backgroundColor={HoffColors.primary} />
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
            ))}
          </View>
        )}
      </ScrollView>
      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        variant={infoModal.variant}
        onPrimary={closeInfoModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  toolbarInner: {
    paddingTop: taskSpacing.md,
    paddingBottom: taskSpacing.md,
    gap: taskSpacing.sm,
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

