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
import { useAuth } from '../../../contexts/AuthContext';
import api, { Tarea } from '../../../services/api';

type FilterTab = 'hoy' | 'pendientes' | 'completadas';

export default function ListaTareasScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('hoy');

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
      if (user?.id) {
        const response = await api.getTareasByTrabajador(user.id);
        if (response.success && response.data) {
          setTareas(response.data);
        }
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
  };

  const getEstadoColor = (estado: string, fecha: string) => {
    const tareaDate = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tareaDate.setHours(0, 0, 0, 0);

    if (estado === 'aprobada') return '#4CAF50'; // Verde - Aprobada (trabajo confirmado)
    if (estado === 'completada') return '#9C27B0'; // Púrpura - Completada (en revisión)
    if (tareaDate < today) return '#F44336'; // Rojo - Vencida
    if (tareaDate.getTime() === today.getTime()) return '#FF9800'; // Naranja - Hoy
    if (estado === 'asignada') return '#2196F3'; // Azul - Asignada
    if (estado === 'cancelada') return '#757575'; // Gris oscuro - Cancelada
    return '#9E9E9E'; // Gris
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
        <ActivityIndicator size="large" color="#4CAF50" />
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
          style={[styles.tab, activeFilter === 'hoy' && styles.tabActive]}
          onPress={() => setActiveFilter('hoy')}
        >
          <Text style={[styles.tabText, activeFilter === 'hoy' && styles.tabTextActive]}>
            Hoy ({getTabCount('hoy')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeFilter === 'pendientes' && styles.tabActive]}
          onPress={() => setActiveFilter('pendientes')}
        >
          <Text style={[styles.tabText, activeFilter === 'pendientes' && styles.tabTextActive]}>
            Pendientes ({getTabCount('pendientes')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeFilter === 'completadas' && styles.tabActive]}
          onPress={() => setActiveFilter('completadas')}
        >
          <Text style={[styles.tabText, activeFilter === 'completadas' && styles.tabTextActive]}>
            Completadas ({getTabCount('completadas')})
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
              {activeFilter === 'hoy' && 'No tienes tareas para hoy'}
              {activeFilter === 'pendientes' && 'No tienes tareas pendientes'}
              {activeFilter === 'completadas' && 'Aún no has completado tareas'}
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
                      { backgroundColor: getEstadoColor(tarea.estado, tarea.fecha_realizacion) },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {getEstadoText(tarea.estado, tarea.fecha_realizacion)}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {tarea.cliente_nombre}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {tarea.descripcion_general}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>📅 {formatFecha(tarea.fecha_realizacion)}</Text>
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => router.push(`/worker/tareas/detalle?id=${tarea.tarea_id}`)}
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
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
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
