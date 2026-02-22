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

type FilterDate = 'todas' | 'hoy' | 'semana' | 'mes';

export default function TrabajosRealizadosScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<FilterDate>('todas');

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
  }, [tareas, dateFilter, searchQuery]);

  const loadTareas = async () => {
    try {
      if (user?.id) {
        const response = await api.getTareasByTrabajador(user.id);
        if (response.success && response.data) {
          // Filtrar solo tareas aprobadas
          const aprobadas = response.data.filter((t: Tarea) => t.estado === 'aprobada');
          setTareas(aprobadas);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los trabajos realizados');
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
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando trabajos realizados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar trabajos realizados..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
      </View>

      {/* Filtros de fecha */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'todas' && styles.filterChipActive]}
            onPress={() => setDateFilter('todas')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'todas' && styles.filterChipTextActive]}>
              Todas ({getDateFilterCount('todas')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'hoy' && styles.filterChipActive]}
            onPress={() => setDateFilter('hoy')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'hoy' && styles.filterChipTextActive]}>
              Hoy ({getDateFilterCount('hoy')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'semana' && styles.filterChipActive]}
            onPress={() => setDateFilter('semana')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'semana' && styles.filterChipTextActive]}>
              Esta semana ({getDateFilterCount('semana')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'mes' && styles.filterChipActive]}
            onPress={() => setDateFilter('mes')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'mes' && styles.filterChipTextActive]}>
              Este mes ({getDateFilterCount('mes')})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de tareas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredTareas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>✅</Text>
            <Text style={styles.emptyStateTitle}>No hay trabajos realizados</Text>
            <Text style={styles.emptyStateSubtitle}>
              {dateFilter === 'todas' && 'Aún no tienes trabajos aprobados'}
              {dateFilter === 'hoy' && 'No se aprobaron trabajos hoy'}
              {dateFilter === 'semana' && 'No se aprobaron trabajos esta semana'}
              {dateFilter === 'mes' && 'No se aprobaron trabajos este mes'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTareas.map((tarea) => (
              <View key={tarea.tarea_id} style={styles.card}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusCircle, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.statusText}>Trabajo realizado</Text>
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
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
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
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
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

