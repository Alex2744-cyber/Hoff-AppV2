import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api, { Trabajador } from '../../../services/api';
import { HoffColors } from '@/constants/theme';

type FilterTab = 'todos' | 'activos' | 'inactivos';

export default function TrabajadoresScreen() {
  const router = useRouter();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterTab>('todos');

  useEffect(() => {
    loadTrabajadores();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTrabajadores();
    }, [])
  );

  const loadTrabajadores = async () => {
    try {
      setLoading(true);
      const response = await api.getTrabajadores();
      if (response.success && response.data) {
        setTrabajadores(response.data);
      }
    } catch (error: any) {
      console.error('Error cargando trabajadores:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrabajadores();
  };

  const filteredTrabajadores = trabajadores.filter((trabajador) => {
    const matchesSearch = 
      trabajador.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trabajador.usuario.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterEstado === 'todos' ||
      (filterEstado === 'activos' && trabajador.activo) ||
      (filterEstado === 'inactivos' && !trabajador.activo);
    
    return matchesSearch && matchesFilter;
  });

  const trabajadoresActivos = trabajadores.filter(t => t.activo).length;
  const trabajadoresInactivos = trabajadores.filter(t => !t.activo).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando trabajadores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra superior con nombre de sección */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>👷 Trabajadores</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar trabajador..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      {/* Filtros por estado */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterEstado === 'todos' && styles.filterTabActive]}
          onPress={() => setFilterEstado('todos')}
        >
          <Text style={[styles.filterTabText, filterEstado === 'todos' && styles.filterTabTextActive]}>
            Todos ({trabajadores.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterEstado === 'activos' && styles.filterTabActive]}
          onPress={() => setFilterEstado('activos')}
        >
          <Text style={[styles.filterTabText, filterEstado === 'activos' && styles.filterTabTextActive]}>
            Activos ({trabajadoresActivos})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterEstado === 'inactivos' && styles.filterTabActive]}
          onPress={() => setFilterEstado('inactivos')}
        >
          <Text style={[styles.filterTabText, filterEstado === 'inactivos' && styles.filterTabTextActive]}>
            Inactivos ({trabajadoresInactivos})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de trabajadores */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTrabajadores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron trabajadores' : 'No hay trabajadores registrados'}
            </Text>
          </View>
        ) : (
          filteredTrabajadores.map((trabajador, index) => (
            <Animated.View
              key={trabajador.id}
              entering={FadeInDown.delay(index * 50).duration(280).springify().damping(14)}
            >
              <TouchableOpacity
                style={[
                  styles.trabajadorCard,
                  !trabajador.activo && styles.trabajadorCardInactivo,
                ]}
                onPress={() => {
                  router.push(`/admin/trabajadores/detalle?id=${trabajador.id}`);
                }}
              >
                <View style={styles.trabajadorHeader}>
                  <View style={styles.trabajadorInfo}>
                    {trabajador.foto_perfil ? (
                      <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                          {trabajador.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.avatarContainer, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {trabajador.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.trabajadorNameContainer}>
                      <Text style={styles.trabajadorNombre}>{trabajador.nombre}</Text>
                      <Text style={styles.trabajadorUsuario}>@{trabajador.usuario}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.estadoBadge,
                    trabajador.activo 
                      ? styles.estadoBadgeActivo 
                      : styles.estadoBadgeInactivo
                  ]}>
                    <Text style={styles.estadoText}>
                      {trabajador.activo ? '✓ Activo' : '✗ Inactivo'}
                    </Text>
                  </View>
                </View>
                {trabajador.descripcion && (
                  <Text style={styles.trabajadorDescripcion} numberOfLines={2}>
                    {trabajador.descripcion}
                  </Text>
                )}
                <View style={styles.trabajadorFooter}>
                  <Text style={styles.trabajadorFecha}>
                    Registrado: {new Date(trabajador.fecha_creacion || Date.now()).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Botón flotante para crear trabajador */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // TODO: Navegar a crear trabajador
          // router.push('/admin/trabajadores/crear')
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  headerBar: {
    backgroundColor: HoffColors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.primaryDark,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: HoffColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  searchInput: {
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: HoffColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: HoffColors.background,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: HoffColors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  filterTabTextActive: {
    color: HoffColors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: HoffColors.textMuted,
  },
  trabajadorCard: {
    backgroundColor: HoffColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: HoffColors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trabajadorCardInactivo: {
    opacity: 0.6,
    backgroundColor: HoffColors.background,
  },
  trabajadorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trabajadorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: HoffColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: HoffColors.textMuted,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
  trabajadorNameContainer: {
    flex: 1,
  },
  trabajadorNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 2,
  },
  trabajadorUsuario: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  estadoBadgeActivo: {
    backgroundColor: HoffColors.secondaryMuted,
  },
  estadoBadgeInactivo: {
    backgroundColor: HoffColors.background,
  },
  estadoIcon: {
    marginRight: 2,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  estadoTextActivo: {
    color: HoffColors.primary,
  },
  estadoTextInactivo: {
    color: HoffColors.textMuted,
  },
  trabajadorDescripcion: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  trabajadorFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  trabajadorFecha: {
    fontSize: 12,
    color: HoffColors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: HoffColors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: HoffColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: HoffColors.white,
    fontWeight: 'bold',
  },
});


