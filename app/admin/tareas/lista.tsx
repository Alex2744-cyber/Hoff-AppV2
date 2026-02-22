import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api, { Tarea } from '../../../services/api';

type FilterTab = 'todas' | 'sin_asignar' | 'en_curso';

export default function ListaTareasScreen() {
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todas');

  useEffect(() => {
    loadTareas();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTareas();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [tareas, activeFilter, searchQuery]);

  const loadTareas = async () => {
    try {
      const response = await api.getTareas();
      if (response.success && response.data) {
        setTareas(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTareas();
  };

  const applyFilters = () => {
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
  };

  const getEstadoColor = (estado: string, fecha: string, trabajadores: string | null) => {
    const tareaDate = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tareaDate.setHours(0, 0, 0, 0);

    if (estado === 'aprobada') return '#4CAF50'; // Verde - Aprobada y cerrada
    if (estado === 'completada') return '#9C27B0'; // Púrpura - Requiere aprobación
    if (estado === 'pendiente' && !trabajadores && tareaDate < today) return '#F44336'; // Rojo - Sin asignar urgente
    if (estado === 'pendiente' && !trabajadores) return '#FF9800'; // Naranja - Sin asignar
    if (estado === 'asignada') return '#2196F3'; // Azul - Asignada
    if (estado === 'cancelada') return '#757575'; // Gris oscuro - Cancelada
    return '#9E9E9E'; // Gris
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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda y filtro */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tareas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterIcon}>🎛️</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs de filtrado */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeFilter === 'todas' && styles.tabActive]}
          onPress={() => setActiveFilter('todas')}
        >
          <Text style={[styles.tabText, activeFilter === 'todas' && styles.tabTextActive]}>
            Todas ({getTabCount('todas')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeFilter === 'sin_asignar' && styles.tabActive]}
          onPress={() => setActiveFilter('sin_asignar')}
        >
          <Text style={[styles.tabText, activeFilter === 'sin_asignar' && styles.tabTextActive]}>
            Sin asignar ({getTabCount('sin_asignar')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeFilter === 'en_curso' && styles.tabActive]}
          onPress={() => setActiveFilter('en_curso')}
        >
          <Text style={[styles.tabText, activeFilter === 'en_curso' && styles.tabTextActive]}>
            En curso ({getTabCount('en_curso')})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de tareas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredTareas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>📋</Text>
            <Text style={styles.emptyStateTitle}>No hay tareas</Text>
            <Text style={styles.emptyStateSubtitle}>
              {activeFilter === 'todas' && 'No hay tareas registradas'}
              {activeFilter === 'sin_asignar' && 'No hay tareas sin asignar'}
              {activeFilter === 'en_curso' && 'No hay tareas en curso'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTareas.map((tarea) => (
              <View key={tarea.tarea_id} style={styles.card}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusCircle,
                      {
                        backgroundColor: getEstadoColor(
                          tarea.estado,
                          tarea.fecha_realizacion,
                          tarea.trabajadores_asignados
                        ),
                      },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {getEstadoText(tarea.estado, tarea.trabajadores_asignados)}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {tarea.cliente_nombre}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {tarea.descripcion_general}
                </Text>
                {tarea.trabajadores_asignados && (
                  <Text style={styles.cardWorker} numberOfLines={1}>
                    👤 {tarea.trabajadores_asignados}
                  </Text>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>📅 {formatFecha(tarea.fecha_realizacion)}</Text>
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => router.push(`/admin/tareas/detalle?id=${tarea.tarea_id}`)}
                  >
                    <Text style={styles.detailsButtonText}>Más detalles »</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchIcon: {
    fontSize: 20,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    minHeight: 36,
  },
  cardWorker: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 8,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  detailsButton: {
    alignSelf: 'flex-start',
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
