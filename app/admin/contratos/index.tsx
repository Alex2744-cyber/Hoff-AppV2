import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskShadowCard, taskSpacing } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';

export default function ContratosScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const clientes = await api.getClientes();
        if (clientes.success && clientes.data) {
          const rows = await Promise.all(
            clientes.data.map(async (c) => {
              const rs = await api.getContratosByCliente(c.id);
              return (rs.data || []).map((it: any) => ({ ...it, cliente_nombre: c.nombre }));
            })
          );
          setItems(rows.flat());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <TaskScreenContainer>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando contratos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              onPress={() => router.push(`/admin/contratos/detalle?id=${c.id}`)}
            >
              <Text style={styles.title}>Contrato #{c.id}</Text>
              <Text style={styles.meta}>{c.cliente_nombre || `Cliente ${c.cliente_id}`}</Text>
              <Text style={styles.meta}>
                Estado: {c.estado} · Valor: €{Number(c.valor_contrato || 0).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
          {items.length === 0 && <Text style={styles.empty}>No hay contratos registrados.</Text>}
        </ScrollView>
      )}
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: taskSpacing.xl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: taskSpacing.sm },
  loadingText: { color: HoffColors.textSecondary },
  card: {
    marginBottom: taskSpacing.md,
    padding: taskSpacing.md,
    borderRadius: taskRadius.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    backgroundColor: HoffColors.surface,
    ...taskShadowCard,
  },
  title: { fontSize: 16, fontWeight: '700', color: HoffColors.text },
  meta: { marginTop: 4, fontSize: 13, color: HoffColors.textSecondary },
  empty: { color: HoffColors.textSecondary },
});
