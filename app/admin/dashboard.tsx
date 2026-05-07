import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import api, { type TareaLista } from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing } from '@/constants/taskUi';
import { TaskScreenContainer, TaskHubLinkRow } from '@/components/tareas';
import { isTaskScheduledToday } from '@/utils/taskDates';

function parseApiNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function parseApiInt(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function formatHoyLargo(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tareasHoy, setTareasHoy] = useState(0);
  const [sinAsignar, setSinAsignar] = useState(0);
  const [porAprobar, setPorAprobar] = useState(0);
  const [trabajadoresActivos, setTrabajadoresActivos] = useState(0);
  const [clientesTotal, setClientesTotal] = useState(0);
  const [ingresosTotales, setIngresosTotales] = useState<number | null>(null);
  const [tareasAprobadasTotal, setTareasAprobadasTotal] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [resTareas, resTrab, resCli, resFin] = await Promise.all([
        api.getTareas(),
        api.getTrabajadores(),
        api.getClientes(),
        api.finanzas.getIngresosTotales(),
      ]);

      let tareas: TareaLista[] = [];
      if (resTareas.success && Array.isArray(resTareas.data)) {
        tareas = resTareas.data;
      }

      const hoy = tareas.filter((t) => isTaskScheduledToday(t.fecha_realizacion)).length;
      const sin = tareas.filter(
        (t) =>
          t.estado === 'pendiente' &&
          !(t.trabajadores_asignados && String(t.trabajadores_asignados).trim())
      ).length;
      const aprobar = tareas.filter((t) => t.estado === 'completada').length;

      setTareasHoy(hoy);
      setSinAsignar(sin);
      setPorAprobar(aprobar);

      if (resTrab.success && Array.isArray(resTrab.data)) {
        setTrabajadoresActivos(resTrab.data.filter((x) => x.activo).length);
      } else {
        setTrabajadoresActivos(0);
      }

      if (resCli.success && Array.isArray(resCli.data)) {
        setClientesTotal(resCli.data.length);
      } else {
        setClientesTotal(0);
      }

      if (resFin.success && resFin.data && typeof resFin.data === 'object') {
        const raw = resFin.data as Record<string, unknown>;
        const nested = raw.data;
        const src =
          nested && typeof nested === 'object' && !Array.isArray(nested)
            ? (nested as Record<string, unknown>)
            : raw;
        setIngresosTotales(parseApiNumber(src.ingresos_totales));
        const totalRaw = src.total_tareas_aprobadas ?? src.total_tareas_pagadas;
        setTareasAprobadasTotal(parseApiInt(totalRaw));
      } else {
        setIngresosTotales(null);
        setTareasAprobadasTotal(null);
      }
    } catch {
      setTareasHoy(0);
      setSinAsignar(0);
      setPorAprobar(0);
      setTrabajadoresActivos(0);
      setClientesTotal(0);
      setIngresosTotales(null);
      setTareasAprobadasTotal(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargar();
    }, [cargar])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  const money =
    ingresosTotales != null
      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
          ingresosTotales
        )
      : '—';

  return (
    <TaskScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.heroPanel}>
            <View style={styles.heroBranding}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={styles.companyLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="analytics-outline" size={14} color={HoffColors.accent} />
                <Text style={styles.heroBadgeText}>Inicio</Text>
              </View>
            </View>
            <Text style={styles.heroSubtitle}>Resumen operativo administrativo</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.heading}>{formatHoyLargo()}</Text>
            <Text style={styles.lead}>Resumen del día y accesos rápidos a cada área.</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={HoffColors.accent} style={styles.loader} />
        ) : (
          <View style={styles.list}>
            <TaskHubLinkRow
              title={`Tareas con fecha de hoy: ${tareasHoy}`}
              subtitle="Listado de tareas · Filtra y abre el detalle"
              icon="calendar-outline"
              emphasize
              onPress={() => router.push('/admin/tareas/lista')}
            />
            <TaskHubLinkRow
              title={`Sin asignar: ${sinAsignar}`}
              subtitle="Pendientes sin staff · Tareas"
              icon="person-add-outline"
              onPress={() => router.push('/admin/tareas/lista')}
            />
            <TaskHubLinkRow
              title={`Por aprobar: ${porAprobar}`}
              subtitle="Completadas a la espera de revisión"
              icon="hourglass-outline"
              onPress={() => router.push('/admin/tareas/completadas')}
            />
            <TaskHubLinkRow
              title={`Staff activo: ${trabajadoresActivos}`}
              subtitle="Equipo y altas · Staff"
              icon="people-outline"
              onPress={() => router.push('/admin/trabajadores')}
            />
            <TaskHubLinkRow
              title={`Clientes: ${clientesTotal}`}
              subtitle="Directorio · Clientes"
              icon="business-outline"
              onPress={() => router.push('/admin/clientes')}
            />
            <TaskHubLinkRow
              title={`Ingresos acumulados: ${money}`}
              subtitle={
                tareasAprobadasTotal != null
                  ? `Tareas aprobadas (total): ${tareasAprobadasTotal} · Finanzas`
                  : 'Resumen global · Finanzas'
              }
              icon="wallet-outline"
              onPress={() => router.push('/admin/finanzas')}
            />
          </View>
        )}
      </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: taskSpacing.sm,
    paddingBottom: taskSpacing.xl,
  },
  header: {
    marginBottom: taskSpacing.xl,
  },
  heroPanel: {
    backgroundColor: HoffColors.primary,
    borderRadius: 18,
    paddingHorizontal: taskSpacing.lg,
    paddingTop: taskSpacing.lg,
    paddingBottom: taskSpacing.xl,
    ...(Platform.OS === 'web' ? { overflow: 'hidden' as const } : {}),
  },
  heroBranding: {
    alignItems: 'center',
    width: '100%',
  },
  logoWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { alignSelf: 'center' },
      default: { alignSelf: 'stretch' },
    }),
  },
  companyLogo: {
    alignSelf: 'center',
    ...Platform.select({
      web: {
        width: 312,
        height: 104,
      },
      default: {
        width: '100%',
        maxWidth: 336,
        aspectRatio: 3,
      },
    }),
  },
  heroBadge: {
    marginTop: taskSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: HoffColors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroSubtitle: {
    marginTop: taskSpacing.md,
    fontSize: 13,
    color: HoffColors.secondaryMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryCard: {
    marginTop: -(taskSpacing.lg + taskSpacing.sm),
    marginHorizontal: taskSpacing.lg,
    backgroundColor: HoffColors.surface,
    borderRadius: 14,
    paddingHorizontal: taskSpacing.lg,
    paddingVertical: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
    shadowColor: HoffColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: HoffColors.primary,
    letterSpacing: -0.3,
    textTransform: 'capitalize',
  },
  lead: {
    marginTop: taskSpacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: HoffColors.textSecondary,
  },
  loader: {
    marginTop: taskSpacing.xl,
    marginHorizontal: taskSpacing.lg,
  },
  list: {
    gap: taskSpacing.md,
    marginHorizontal: taskSpacing.lg,
  },
});
