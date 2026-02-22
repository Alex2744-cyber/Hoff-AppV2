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
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';

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
        setClientes(response.data);
      }
    } catch (error: any) {
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

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (cliente.email && cliente.email.toLowerCase().includes(searchQuery.toLowerCase()));
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
      {/* Barra de búsqueda y filtros */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={HoffColors.textMuted}
        />
      </View>

      {/* Filtros por tipo */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterTipo === 'todos' && styles.filterTabActive]}
          onPress={() => setFilterTipo('todos')}
        >
          <Text style={[styles.filterTabText, filterTipo === 'todos' && styles.filterTabTextActive]}>
            Todos ({clientes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterTipo === 'empresa' && styles.filterTabActive]}
          onPress={() => setFilterTipo('empresa')}
        >
          <Text style={[styles.filterTabText, filterTipo === 'empresa' && styles.filterTabTextActive]}>
            Empresas ({clientes.filter(c => c.tipo === 'empresa').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterTipo === 'particular' && styles.filterTabActive]}
          onPress={() => setFilterTipo('particular')}
        >
          <Text style={[styles.filterTabText, filterTipo === 'particular' && styles.filterTabTextActive]}>
            Particulares ({clientes.filter(c => c.tipo === 'particular').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de clientes */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredClientes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </Text>
          </View>
        ) : (
          filteredClientes.map((cliente) => (
            <TouchableOpacity
              key={cliente.id}
              style={styles.clienteCard}
              onPress={() => router.push(`/admin/clientes/editar?id=${cliente.id}`)}
            >
              <View style={styles.clienteHeader}>
                <View style={[styles.tipoBadge, { backgroundColor: getTipoColor(cliente.tipo) }]}>
                  <Ionicons name={getTipoIconName(cliente.tipo)} size={14} color={HoffColors.white} />
                  <Text style={styles.tipoText}>
                    {cliente.tipo === 'empresa' ? 'Empresa' : 'Particular'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
              
              {cliente.tipo === 'empresa' && cliente.nombre_empresa && (
                <Text style={styles.clienteEmpresa}>{cliente.nombre_empresa}</Text>
              )}

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
                    <Ionicons name="person-tie-outline" size={14} color={HoffColors.textSecondary} style={styles.infoIcon} />
                    <Text style={styles.administradorLabel}>Administrador:</Text>
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
          ))
        )}
      </ScrollView>

      {/* Botón flotante para crear cliente */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/admin/clientes/crear')}
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
  clienteCard: {
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
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  tipoIcon: {
    fontSize: 14,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clienteEmpresa: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  clienteInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  administradorContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
    color: '#333',
    fontWeight: '500',
  },
  administradorInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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

