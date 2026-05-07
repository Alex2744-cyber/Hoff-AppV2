import React, { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { ClienteAvatar } from '@/components/clientes/ClienteAvatar';
import { ConfirmModal, InfoModal } from '@/components/tareas';

function clienteDisplayName(cliente: {
  tipo: string;
  nombre: string;
  nombre_empresa?: string | null;
}) {
  return cliente.tipo === 'empresa'
    ? (cliente.nombre_empresa || cliente.nombre || '').trim() || '—'
    : (cliente.nombre || '').trim() || '—';
}

export default function ClienteDetalleScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [cliente, setCliente] = useState<any | null>(null);
  const [numDirecciones, setNumDirecciones] = useState(0);
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDesactivarConfirm, setShowDesactivarConfirm] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [contractStatusFilter, setContractStatusFilter] = useState<'todos' | 'activo' | 'cerrado' | 'pagado'>('todos');
  const [contractSearch, setContractSearch] = useState('');
  const [contractMenuOpen, setContractMenuOpen] = useState(false);
  const [contractMenuTarget, setContractMenuTarget] = useState<any | null>(null);
  const [contractActionLoadingId, setContractActionLoadingId] = useState<number | null>(null);
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

  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [resCliente, resDir, resContratos] = await Promise.all([
        api.getClienteById(Number(id)),
        api.getDireccionesByCliente(Number(id)),
        api.getContratosByCliente(Number(id)),
      ]);
      if (resCliente.success && resCliente.data) {
        setCliente(resCliente.data);
      } else {
        setCliente(null);
      }
      if (resDir.success && Array.isArray(resDir.data)) {
        setNumDirecciones(resDir.data.length);
      } else {
        setNumDirecciones(0);
      }
      if (resContratos.success && Array.isArray(resContratos.data)) {
        setContratos(resContratos.data);
      } else {
        setContratos([]);
      }
    } catch {
      openInfoModal('Error', 'No se pudo cargar el cliente', 'error', () => router.back());
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={{ paddingRight: 16 }}
          accessibilityLabel="Opciones del cliente"
        >
          <Ionicons name="ellipsis-vertical" size={24} color={HoffColors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const title = cliente ? clienteDisplayName(cliente) : '';
  const contratosStats = useMemo(() => {
    const total = contratos.length;
    const activos = contratos.filter((c) => c.estado === 'activo').length;
    const pagados = contratos.filter((c) => c.estado === 'pagado').length;
    const valorTotal = contratos.reduce((acc, c) => acc + Number(c.valor_contrato || 0), 0);
    return { total, activos, pagados, valorTotal };
  }, [contratos]);

  const contratosFiltrados = useMemo(() => {
    const byStatus =
      contractStatusFilter === 'todos'
        ? contratos
        : contratos.filter((c) => String(c.estado).toLowerCase() === contractStatusFilter);
    const q = contractSearch.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((c) => {
      const contratoId = String(c.id ?? '');
      const desc = String(c.descripcion_contrato ?? '').toLowerCase();
      const estado = String(c.estado ?? '').toLowerCase();
      return contratoId.includes(q) || desc.includes(q) || estado.includes(q);
    });
  }, [contratos, contractStatusFilter, contractSearch]);

  const openContractMenu = (contrato: any) => {
    setContractMenuTarget(contrato);
    setContractMenuOpen(true);
  };

  const openEditar = () => {
    setMenuOpen(false);
    router.push({ pathname: '/admin/clientes/editar', params: { id: String(id) } });
  };

  const openDirecciones = () => {
    setMenuOpen(false);
    router.push({ pathname: '/admin/clientes/direcciones', params: { id: String(id) } });
  };

  const confirmDesactivar = () => {
    setMenuOpen(false);
    if (!cliente) return;
    setShowDesactivarConfirm(true);
  };

  const confirmarDesactivar = async () => {
    if (desactivando) return;
    try {
      setDesactivando(true);
      const res = await api.updateCliente(Number(id), { activo: false });
      if (res.success) {
        setShowDesactivarConfirm(false);
        router.back();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo desactivar';
      openInfoModal('Error', msg, 'error');
    } finally {
      setDesactivando(false);
    }
  };

  if (loading && !cliente) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  if (!cliente) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cliente no encontrado</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  return (
    <TaskScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ClienteAvatar nombre={title} fotoUri={cliente.foto_perfil} size={72} />
          <View style={[styles.tipoBadge, { backgroundColor: cliente.tipo === 'empresa' ? HoffColors.primary : HoffColors.accent }]}>
            <Ionicons
              name={cliente.tipo === 'empresa' ? 'business-outline' : 'person-outline'}
              size={16}
              color={HoffColors.white}
            />
            <Text style={styles.tipoText}>{cliente.tipo === 'empresa' ? 'Empresa' : 'Particular'}</Text>
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
        </View>

        {(cliente.telefono || cliente.email) && (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Contacto</Text>
            <ReadRow icon="call-outline" label="Teléfono" value={cliente.telefono} />
            <ReadRow icon="mail-outline" label="Email" value={cliente.email} />
          </View>
        )}

        {cliente.tipo === 'empresa' &&
          (cliente.administrador_nombre || cliente.administrador_telefono || cliente.administrador_email) && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Administrador</Text>
              <ReadRow label="Nombre" value={cliente.administrador_nombre} />
              <ReadRow icon="call-outline" label="Teléfono" value={cliente.administrador_telefono} />
              <ReadRow icon="mail-outline" label="Email" value={cliente.administrador_email} />
            </View>
          )}

        {!!cliente.descripcion && (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Descripción</Text>
            <Text style={styles.bodyText}>{cliente.descripcion}</Text>
          </View>
        )}

        {!!cliente.foto_perfil && (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Foto de perfil</Text>
            <Text style={styles.urlText} selectable>
              {cliente.foto_perfil}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Direcciones</Text>
          <Text style={styles.bodyText}>
            {numDirecciones === 0
              ? 'Ninguna dirección registrada.'
              : `${numDirecciones} dirección${numDirecciones === 1 ? '' : 'es'} registrada${numDirecciones === 1 ? '' : 's'}.`}
          </Text>
          <TouchableOpacity style={styles.linkButton} onPress={openDirecciones}>
            <Text style={styles.linkButtonText}>Gestionar direcciones</Text>
            <Ionicons name="chevron-forward" size={20} color={HoffColors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Contratos</Text>
          <View style={styles.contractStatsGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{contratosStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{contratosStats.activos}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{contratosStats.pagados}</Text>
              <Text style={styles.statLabel}>Pagados</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>€{contratosStats.valorTotal.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Valor total</Text>
            </View>
          </View>

          <View style={styles.contractFilterRow}>
            {(['todos', 'activo', 'cerrado', 'pagado'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.contractFilterChip, contractStatusFilter === status && styles.contractFilterChipActive]}
                onPress={() => setContractStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.contractFilterChipText,
                    contractStatusFilter === status && styles.contractFilterChipTextActive,
                  ]}
                >
                  {status === 'todos' ? 'Todos' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.contractSearchInput}
            placeholder="Buscar por # contrato, estado o descripción"
            value={contractSearch}
            onChangeText={setContractSearch}
            placeholderTextColor={HoffColors.textMuted}
          />

          {contratos.length === 0 ? (
            <Text style={styles.bodyText}>No hay contratos vinculados a este cliente.</Text>
          ) : contratosFiltrados.length === 0 ? (
            <Text style={styles.bodyText}>No hay contratos para ese filtro o búsqueda.</Text>
          ) : (
            contratosFiltrados.map((c) => (
              <View key={c.id} style={styles.contractCard}>
                <View style={styles.contractCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contractTitle}>Contrato #{c.id}</Text>
                    <Text style={styles.contractMeta}>
                      {c.descripcion_contrato?.trim() || 'Sin descripción'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.contractBadge,
                      c.estado === 'pagado'
                        ? styles.contractBadgePaid
                        : c.estado === 'cerrado'
                        ? styles.contractBadgeClosed
                        : styles.contractBadgeActive,
                    ]}
                  >
                    <Text style={styles.contractBadgeText}>{String(c.estado).toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.contractRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contractMeta}>Valor: €{Number(c.valor_contrato || 0).toFixed(2)}</Text>
                    <Text style={styles.contractMeta}>
                      Tareas: {Number(c.total_tareas || 0)} · Fechas:{' '}
                      {c.fecha_inicio || '—'} a {c.fecha_fin || '—'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.contractMenuButton}
                    onPress={() => openContractMenu(c)}
                    disabled={contractActionLoadingId === c.id}
                  >
                    {contractActionLoadingId === c.id ? (
                      <ActivityIndicator size="small" color={HoffColors.primary} />
                    ) : (
                      <Ionicons name="ellipsis-vertical" size={18} color={HoffColors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity style={styles.menuRow} onPress={openEditar}>
              <Ionicons name="create-outline" size={22} color={HoffColors.text} />
              <Text style={styles.menuRowText}>Editar cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={openDirecciones}>
              <Ionicons name="location-outline" size={22} color={HoffColors.text} />
              <Text style={styles.menuRowText}>Gestionar direcciones</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, styles.menuRowDanger]} onPress={confirmDesactivar}>
              <Ionicons name="ban-outline" size={22} color="#c62828" />
              <Text style={[styles.menuRowText, styles.menuRowTextDanger]}>Desactivar cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={contractMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setContractMenuOpen(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setContractMenuOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {contractMenuTarget ? `Contrato #${contractMenuTarget.id}` : 'Contrato'}
            </Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                if (!contractMenuTarget) return;
                setContractMenuOpen(false);
                router.push(`/admin/contratos/detalle?id=${contractMenuTarget.id}`);
              }}
            >
              <Ionicons name="eye-outline" size={22} color={HoffColors.text} />
              <Text style={styles.menuRowText}>Ver contrato</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                if (!contractMenuTarget) return;
                setContractMenuOpen(false);
                router.push(`/admin/contratos/editar?id=${contractMenuTarget.id}`);
              }}
            >
              <Ionicons name="create-outline" size={22} color={HoffColors.text} />
              <Text style={styles.menuRowText}>Editar contrato</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                if (!contractMenuTarget) return;
                setContractMenuOpen(false);
                router.push(`/admin/contratos/detalle?id=${contractMenuTarget.id}`);
              }}
            >
              <Ionicons name="list-outline" size={22} color={HoffColors.text} />
              <Text style={styles.menuRowText}>Gestionar tareas</Text>
            </TouchableOpacity>
            {contractMenuTarget?.estado !== 'pagado' && (
              <TouchableOpacity
                style={styles.menuRow}
                onPress={async () => {
                  if (!contractMenuTarget) return;
                  setContractActionLoadingId(Number(contractMenuTarget.id));
                  setContractMenuOpen(false);
                  try {
                    const res = await api.pagarContrato(Number(contractMenuTarget.id), {});
                    if (res.success) {
                      openInfoModal('Contrato pagado', 'Se registró el pago del contrato.', 'success', loadAll);
                    } else {
                      openInfoModal('Error', res.error || 'No se pudo marcar como pagado', 'error');
                    }
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'No se pudo marcar como pagado';
                    openInfoModal('Error', msg, 'error');
                  } finally {
                    setContractActionLoadingId(null);
                  }
                }}
              >
                <Ionicons name="checkmark-done-outline" size={22} color={HoffColors.text} />
                <Text style={styles.menuRowText}>Marcar pagado</Text>
              </TouchableOpacity>
            )}
            {contractMenuTarget?.estado !== 'cerrado' && contractMenuTarget?.estado !== 'pagado' && (
              <TouchableOpacity
                style={[styles.menuRow, styles.menuRowDanger]}
                onPress={async () => {
                  if (!contractMenuTarget) return;
                  setContractActionLoadingId(Number(contractMenuTarget.id));
                  setContractMenuOpen(false);
                  try {
                    const res = await api.cerrarContrato(Number(contractMenuTarget.id));
                    if (res.success) {
                      openInfoModal('Contrato cerrado', 'El contrato se cerró y quedó bloqueado.', 'success', loadAll);
                    } else {
                      openInfoModal('Error', res.error || 'No se pudo cerrar el contrato', 'error');
                    }
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'No se pudo cerrar el contrato';
                    openInfoModal('Error', msg, 'error');
                  } finally {
                    setContractActionLoadingId(null);
                  }
                }}
              >
                <Ionicons name="lock-closed-outline" size={22} color="#c62828" />
                <Text style={[styles.menuRowText, styles.menuRowTextDanger]}>Cerrar contrato</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuCancel} onPress={() => setContractMenuOpen(false)}>
              <Text style={styles.menuCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <ConfirmModal
        visible={showDesactivarConfirm}
        title="¿Desactivar cliente?"
        message={`«${title}»: al desactivar, sus direcciones se eliminarán salvo que estén en uso en alguna tarea. No aparecerá en las listas de selección; podrá reactivarse más adelante.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        loading={desactivando}
        onCancel={() => {
          if (desactivando) return;
          setShowDesactivarConfirm(false);
        }}
        onConfirm={confirmarDesactivar}
      />
      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        variant={infoModal.variant}
        onPrimary={closeInfoModal}
      />
    </TaskScreenContainer>
  );
}

function ReadRow({
  icon,
  label,
  value,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  if (value == null || String(value).trim() === '') return null;
  return (
    <View style={styles.readRow}>
      {icon ? <Ionicons name={icon} size={18} color={HoffColors.textSecondary} style={styles.readIcon} /> : null}
      <View style={styles.readCol}>
        <Text style={styles.readLabel}>{label}</Text>
        <Text style={styles.readValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: taskSpacing.xxl },
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
  hero: {
    alignItems: 'center',
    paddingVertical: taskSpacing.lg,
    paddingHorizontal: taskSpacing.lg,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: taskSpacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tipoText: {
    fontSize: 13,
    fontWeight: '600',
    color: HoffColors.white,
  },
  heroTitle: {
    marginTop: taskSpacing.md,
    fontSize: 22,
    fontWeight: '700',
    color: HoffColors.text,
    textAlign: 'center',
  },
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginHorizontal: taskSpacing.lg,
    marginBottom: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: HoffColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: taskSpacing.md,
  },
  readRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: taskSpacing.md,
  },
  readIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  readCol: { flex: 1 },
  readLabel: {
    fontSize: 12,
    color: HoffColors.textMuted,
    marginBottom: 4,
  },
  readValue: {
    fontSize: 16,
    color: HoffColors.text,
  },
  bodyText: {
    fontSize: 16,
    color: HoffColors.text,
    lineHeight: 22,
  },
  urlText: {
    fontSize: 13,
    color: HoffColors.textSecondary,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: taskSpacing.md,
    paddingVertical: taskSpacing.sm,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.primary,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
    paddingTop: taskSpacing.sm,
    marginTop: taskSpacing.sm,
    gap: taskSpacing.sm,
  },
  contractStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: taskSpacing.sm,
    marginBottom: taskSpacing.md,
  },
  statTile: {
    minWidth: 90,
    flex: 1,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.background,
    padding: taskSpacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: HoffColors.primary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: HoffColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contractFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: taskSpacing.xs,
    marginBottom: taskSpacing.sm,
  },
  contractFilterChip: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: 999,
    paddingHorizontal: taskSpacing.sm,
    paddingVertical: 6,
    backgroundColor: HoffColors.background,
  },
  contractFilterChipActive: {
    backgroundColor: HoffColors.primary,
    borderColor: HoffColors.primary,
  },
  contractFilterChipText: {
    color: HoffColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  contractFilterChipTextActive: {
    color: HoffColors.white,
  },
  contractSearchInput: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    paddingHorizontal: taskSpacing.md,
    paddingVertical: taskSpacing.sm,
    color: HoffColors.text,
    backgroundColor: HoffColors.surface,
    marginBottom: taskSpacing.sm,
  },
  contractCard: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.background,
    padding: taskSpacing.md,
    marginTop: taskSpacing.sm,
  },
  contractCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: taskSpacing.sm,
  },
  contractTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: HoffColors.text,
  },
  contractMeta: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    marginTop: 2,
  },
  contractBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  contractBadgeActive: {
    backgroundColor: 'rgba(10,66,50,0.1)',
    borderColor: HoffColors.primary,
  },
  contractBadgeClosed: {
    backgroundColor: 'rgba(245,124,0,0.12)',
    borderColor: '#F57C00',
  },
  contractBadgePaid: {
    backgroundColor: 'rgba(46,125,50,0.12)',
    borderColor: '#2E7D32',
  },
  contractBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: HoffColors.textSecondary,
  },
  contractMenuButton: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HoffColors.surface,
  },
  contractPayButton: {
    backgroundColor: HoffColors.primary,
    borderRadius: taskRadius.sm,
    paddingHorizontal: taskSpacing.md,
    paddingVertical: taskSpacing.sm,
  },
  contractActionsCol: {
    gap: taskSpacing.xs,
    marginRight: taskSpacing.xs,
  },
  contractSecondaryButton: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    paddingHorizontal: taskSpacing.sm,
    paddingVertical: taskSpacing.xs,
    backgroundColor: HoffColors.background,
  },
  contractSecondaryButtonText: {
    color: HoffColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  contractPayButtonText: {
    color: HoffColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  contractPaid: {
    color: HoffColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: taskSpacing.lg,
  },
  menuSheet: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    paddingVertical: taskSpacing.sm,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: HoffColors.text,
    paddingHorizontal: taskSpacing.lg,
    paddingBottom: taskSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
    marginBottom: taskSpacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.md,
    paddingVertical: 14,
    paddingHorizontal: taskSpacing.lg,
  },
  menuRowDanger: {
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
    marginTop: taskSpacing.xs,
  },
  menuRowText: {
    fontSize: 16,
    color: HoffColors.text,
  },
  menuRowTextDanger: {
    color: '#c62828',
    fontWeight: '600',
  },
  menuCancel: {
    alignItems: 'center',
    paddingVertical: taskSpacing.md,
    marginTop: taskSpacing.xs,
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
});
