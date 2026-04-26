import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
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

export default function ClienteDetalleScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [cliente, setCliente] = useState<any | null>(null);
  const [numDirecciones, setNumDirecciones] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [resCliente, resDir] = await Promise.all([
        api.getClienteById(Number(id)),
        api.getDireccionesByCliente(Number(id)),
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
    } catch {
      Alert.alert('Error', 'No se pudo cargar el cliente');
      router.back();
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
    Alert.alert(
      '¿Desactivar cliente?',
      `«${title}»: al desactivar, sus direcciones se eliminarán salvo que estén en uso en alguna tarea. No aparecerá en las listas de selección; podrá reactivarse más adelante.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.updateCliente(Number(id), { activo: false });
              if (res.success) {
                router.back();
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'No se pudo desactivar';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
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
