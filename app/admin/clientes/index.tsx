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
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api from '../../../services/api';
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

function clienteDisplayName(cliente: {
  tipo: string;
  nombre: string;
  nombre_empresa?: string | null;
}) {
  return cliente.tipo === 'empresa'
    ? (cliente.nombre_empresa || cliente.nombre || '').trim() || '—'
    : (cliente.nombre || '').trim() || '—';
}

export default function ClientesScreen() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'empresa' | 'particular'>('todos');

  useEffect(() => {
    loadClientes();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadClientes();
    }, [])
  );

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await api.getClientes();
      if (response.success) {
        setClientes(response.data ?? []);
      }
    } catch (error: unknown) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientes();
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredClientes = clientes.filter((cliente) => {
    const display = clienteDisplayName(cliente).toLowerCase();
    const matchesSearch =
      !q ||
      display.includes(q) ||
      (cliente.email && String(cliente.email).toLowerCase().includes(q)) ||
      (cliente.telefono && String(cliente.telefono).toLowerCase().includes(q)) ||
      (cliente.administrador_nombre &&
        String(cliente.administrador_nombre).toLowerCase().includes(q));
    const matchesFilter = filterTipo === 'todos' || cliente.tipo === filterTipo;
    return matchesSearch && matchesFilter;
  });

  const getTipoColor = (tipo: string) => {
    return tipo === 'empresa' ? HoffColors.primary : HoffColors.accent;
  };

  const getTipoIconName = (tipo: string): keyof typeof Ionicons.glyphMap => {
    return tipo === 'empresa' ? 'business-outline' : 'person-outline';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={taskToolbarStrip}>
        <View style={taskToolbarColumn}>
          <View style={styles.searchWrap}>
            <TaskSearchField
              placeholder="Buscar por nombre, email, teléfono…"
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
                filterTipo === 'todos' && taskFilterChipStyles.chipActive,
              ]}
              onPress={() => setFilterTipo('todos')}
            >
              <Text
                style={[
                  taskFilterChipStyles.chipText,
                  filterTipo === 'todos' && taskFilterChipStyles.chipTextActive,
                ]}
              >
                Todos ({clientes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                taskFilterChipStyles.chip,
                filterTipo === 'empresa' && taskFilterChipStyles.chipActive,
              ]}
              onPress={() => setFilterTipo('empresa')}
            >
              <Text
                style={[
                  taskFilterChipStyles.chipText,
                  filterTipo === 'empresa' && taskFilterChipStyles.chipTextActive,
                ]}
              >
                Empresas ({clientes.filter((c) => c.tipo === 'empresa').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                taskFilterChipStyles.chip,
                filterTipo === 'particular' && taskFilterChipStyles.chipActive,
              ]}
              onPress={() => setFilterTipo('particular')}
            >
              <Text
                style={[
                  taskFilterChipStyles.chipText,
                  filterTipo === 'particular' && taskFilterChipStyles.chipTextActive,
                ]}
              >
                Particulares ({clientes.filter((c) => c.tipo === 'particular').length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <View style={styles.listOuter}>
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredClientes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </Text>
            </View>
          ) : (
            filteredClientes.map((cliente) => {
              const title = clienteDisplayName(cliente);
              return (
                <TouchableOpacity
                  key={cliente.id}
                  style={styles.clienteCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/admin/clientes/detalle',
                      params: { id: String(cliente.id) },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Ver cliente ${title}`}
                >
                  <View style={styles.clienteTopRow}>
                    <ClienteAvatar nombre={title} fotoUri={cliente.foto_perfil} size={48} />
                    <View style={styles.clienteBody}>
                      <View style={styles.clienteHeaderRow}>
                        <View style={[styles.tipoBadge, { backgroundColor: getTipoColor(cliente.tipo) }]}>
                          <Ionicons name={getTipoIconName(cliente.tipo)} size={14} color={HoffColors.white} />
                          <Text style={styles.tipoText}>
                            {cliente.tipo === 'empresa' ? 'Empresa' : 'Particular'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color={HoffColors.textMuted} />
                      </View>

                      <Text style={styles.clienteNombre}>{title}</Text>
                    </View>
                  </View>

                  {cliente.telefono && (
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={16} color={HoffColors.textSecondary} style={styles.infoIcon} />
                      <Text style={styles.clienteInfo}>{cliente.telefono}</Text>
                    </View>
                  )}

                  {cliente.email && (
                    <View style={styles.infoRow}>
                      <Ionicons name="mail-outline" size={16} color={HoffColors.textSecondary} style={styles.infoIcon} />
                      <Text style={styles.clienteInfo}>{cliente.email}</Text>
                    </View>
                  )}

                  {cliente.tipo === 'empresa' && cliente.administrador_nombre && (
                    <View style={styles.administradorContainer}>
                      <View style={[styles.infoRow, styles.administradorLabelRow]}>
                        <Ionicons name="briefcase-outline" size={14} color={HoffColors.textSecondary} style={styles.infoIcon} />
                        <Text style={styles.administradorLabel}>Administrador</Text>
                      </View>
                      <Text style={styles.administradorNombre}>{cliente.administrador_nombre}</Text>
                      {cliente.administrador_telefono && (
                        <View style={styles.infoRow}>
                          <Ionicons name="call-outline" size={14} color={HoffColors.textMuted} style={styles.infoIcon} />
                          <Text style={styles.administradorInfo}>{cliente.administrador_telefono}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/admin/clientes/crear')}
        accessibilityRole="button"
        accessibilityLabel="Crear cliente"
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
  clienteCard: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginBottom: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  clienteTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: taskSpacing.md,
    marginBottom: taskSpacing.sm,
  },
  clienteBody: {
    flex: 1,
    minWidth: 0,
  },
  clienteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: '600',
    color: HoffColors.white,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 4,
  },
  clienteInfo: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  administradorContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  administradorLabelRow: {
    marginBottom: 4,
  },
  administradorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  administradorNombre: {
    fontSize: 14,
    color: HoffColors.text,
    fontWeight: '500',
  },
  administradorInfo: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginTop: 2,
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
