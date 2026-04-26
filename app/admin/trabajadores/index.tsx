import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api, { Trabajador } from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import {
  taskContentMaxWidth,
  taskSpacing,
  taskRadius,
  taskShadowCard,
  taskToolbarStrip,
  taskToolbarColumn,
  taskFilterChipStyles,
} from '@/constants/taskUi';
import { TaskSearchField } from '@/components/tareas/TaskSearchField';
import { ClienteAvatar } from '@/components/clientes/ClienteAvatar';

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
        setTrabajadores(response.data ?? []);
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

  const trabajadoresActivos = trabajadores.filter((t) => t.activo).length;
  const trabajadoresInactivos = trabajadores.filter((t) => !t.activo).length;

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
      <View style={taskToolbarStrip}>
        <View style={taskToolbarColumn}>
          <View style={styles.searchWrap}>
            <TaskSearchField
              placeholder="Buscar trabajador..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <TouchableOpacity
              style={[
                taskFilterChipStyles.chip,
                filterEstado === 'todos' && taskFilterChipStyles.chipActive,
              ]}
              onPress={() => setFilterEstado('todos')}
            >
              <Text
                style={[
                  taskFilterChipStyles.chipText,
                  filterEstado === 'todos' && taskFilterChipStyles.chipTextActive,
                ]}
              >
                Todos ({trabajadores.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                taskFilterChipStyles.chip,
                filterEstado === 'activos' && taskFilterChipStyles.chipActive,
              ]}
              onPress={() => setFilterEstado('activos')}
            >
              <Text
                style={[
                  taskFilterChipStyles.chipText,
                  filterEstado === 'activos' && taskFilterChipStyles.chipTextActive,
                ]}
              >
                Activos ({trabajadoresActivos})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                taskFilterChipStyles.chip,
                filterEstado === 'inactivos' && taskFilterChipStyles.chipActive,
              ]}
              onPress={() => setFilterEstado('inactivos')}
            >
              <Text
                style={[
                  taskFilterChipStyles.chipText,
                  filterEstado === 'inactivos' && taskFilterChipStyles.chipTextActive,
                ]}
              >
                Inactivos ({trabajadoresInactivos})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <View style={styles.listOuter}>
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
                  <View style={styles.trabajadorTopRow}>
                    <ClienteAvatar
                      nombre={trabajador.nombre}
                      fotoUri={trabajador.foto_perfil}
                      size={48}
                    />
                    <View style={styles.trabajadorBody}>
                      <View style={styles.trabajadorHeader}>
                        <View
                          style={[
                            styles.estadoBadge,
                            trabajador.activo ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo,
                          ]}
                        >
                          <Text
                            style={[
                              styles.estadoText,
                              trabajador.activo ? styles.estadoTextActivo : styles.estadoTextInactivo,
                            ]}
                          >
                            {trabajador.activo ? 'Activo' : 'Inactivo'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.trabajadorNombre}>{trabajador.nombre}</Text>
                      <Text style={styles.trabajadorUsuario}>@{trabajador.usuario}</Text>
                    </View>
                  </View>

                  {trabajador.descripcion && (
                    <Text style={styles.trabajadorDescripcion} numberOfLines={2}>
                      {trabajador.descripcion}
                    </Text>
                  )}
                  <View style={styles.trabajadorFooter}>
                    <Text style={styles.trabajadorFecha}>
                      Registrado:{' '}
                      {new Date(trabajador.fecha_creacion || Date.now()).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/admin/trabajadores/crear')}
        accessibilityRole="button"
        accessibilityLabel="Crear trabajador"
      >
        <Ionicons name="add" size={28} color={HoffColors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.background,
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
  searchWrap: {
    paddingTop: taskSpacing.md,
    paddingBottom: taskSpacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: taskSpacing.md,
  },
  listOuter: {
    flex: 1,
    maxWidth: taskContentMaxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: taskSpacing.lg,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: taskSpacing.md,
    paddingBottom: 96,
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
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginBottom: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  trabajadorCardInactivo: {
    opacity: 0.65,
    backgroundColor: HoffColors.background,
  },
  trabajadorTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: taskSpacing.md,
    marginBottom: taskSpacing.sm,
  },
  trabajadorBody: {
    flex: 1,
    minWidth: 0,
  },
  trabajadorHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: taskRadius.full,
  },
  estadoBadgeActivo: {
    backgroundColor: HoffColors.secondaryMuted,
  },
  estadoBadgeInactivo: {
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.border,
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
    backgroundColor: HoffColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...taskShadowCard,
  },
});
