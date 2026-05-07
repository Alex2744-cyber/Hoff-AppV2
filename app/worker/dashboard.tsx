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
import { useAuth } from '@/contexts/AuthContext';
import api, { type TareaLista } from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing } from '@/constants/taskUi';
import { TaskScreenContainer, TaskHubLinkRow } from '@/components/tareas';
import { isTaskScheduledToday } from '@/utils/taskDates';

function formatHoyLargo(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tareasHoyActivas, setTareasHoyActivas] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [enRevision, setEnRevision] = useState(0);
  const [aprobadas, setAprobadas] = useState(0);

  const cargar = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await api.getTareasByTrabajador(user.id);
      const tareas: TareaLista[] = res.success && Array.isArray(res.data) ? res.data : [];

      const hoyAct = tareas.filter(
        (t) => isTaskScheduledToday(t.fecha_realizacion) && t.estado !== 'completada'
      ).length;
      const pend = tareas.filter((t) => t.estado === 'pendiente' || t.estado === 'asignada').length;
      const rev = tareas.filter((t) => t.estado === 'completada').length;
      const apr = tareas.filter((t) => t.estado === 'aprobada').length;

      setTareasHoyActivas(hoyAct);
      setPendientes(pend);
      setEnRevision(rev);
      setAprobadas(apr);
    } catch {
      setTareasHoyActivas(0);
      setPendientes(0);
      setEnRevision(0);
      setAprobadas(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

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

  const nombre = user?.nombre?.split(' ')[0] ?? 'Hola';

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
                <Ionicons name="sparkles-outline" size={14} color={HoffColors.accent} />
                <Text style={styles.heroBadgeText}>Inicio</Text>
              </View>
            </View>
            <Text style={styles.heroSubtitle}>Panel diario del staff</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.heading}>
              {nombre}, {formatHoyLargo()}
            </Text>
            <Text style={styles.lead}>Tu día y accesos a mis tareas.</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={HoffColors.primary} style={styles.loader} />
        ) : (
          <View style={styles.list}>
            <TaskHubLinkRow
              title={`Tareas de hoy (activas): ${tareasHoyActivas}`}
              subtitle="Misma lógica que la pestaña «Hoy» · Ver tareas"
              icon="today-outline"
              emphasize
              onPress={() => router.push('/worker/tareas/lista')}
            />
            <TaskHubLinkRow
              title={`Pendientes / asignadas: ${pendientes}`}
              subtitle="Todo lo que aún debes ejecutar"
              icon="clipboard-outline"
              onPress={() => router.push('/worker/tareas/lista')}
            />
            <TaskHubLinkRow
              title={`En revisión: ${enRevision}`}
              subtitle="Completadas enviadas al administrador"
              icon="hourglass-outline"
              onPress={() => router.push('/worker/tareas/completadas')}
            />
            <TaskHubLinkRow
              title={`Aprobadas (historial reciente): ${aprobadas}`}
              subtitle="Trabajos ya cerrados · Realizados"
              icon="checkmark-done-outline"
              onPress={() => router.push('/worker/tareas/realizados')}
            />
            <TaskHubLinkRow
              title="Perfil y contraseña"
              subtitle="Tu cuenta · Perfil"
              icon="person-outline"
              onPress={() => router.push('/worker/perfil')}
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
    lineHeight: 32,
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
