import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { HoffColors } from '@/constants/theme';
import { taskSpacing } from '@/constants/taskUi';
import { TaskScreenContainer, TaskHubLinkRow } from '@/components/tareas';

export default function TareasMenuScreen() {
  const router = useRouter();

  return (
    <TaskScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Tareas</Text>
          <Text style={styles.lead}>Gestiona órdenes de trabajo, seguimiento y cierre.</Text>
        </View>

        <View style={styles.list}>
          <TaskHubLinkRow
            title="Crear tarea"
            subtitle="Registrar una nueva orden para el equipo"
            icon="add-circle-outline"
            emphasize
            onPress={() => router.push('/admin/tareas/crear')}
          />
          <TaskHubLinkRow
            title="Ver tareas"
            subtitle="Listado, filtros y detalle"
            icon="list-outline"
            onPress={() => router.push('/admin/tareas/lista')}
          />
          <TaskHubLinkRow
            title="Completadas"
            subtitle="Tareas marcadas como hechas, pendientes de aprobar"
            icon="hourglass-outline"
            onPress={() => router.push('/admin/tareas/completadas')}
          />
          <TaskHubLinkRow
            title="Trabajos realizados"
            subtitle="Historial aprobado y contabilizado"
            icon="checkmark-done-outline"
            onPress={() => router.push('/admin/tareas/realizados')}
          />
          <TaskHubLinkRow
            title="Contratos"
            subtitle="Ver y gestionar contratos vinculados"
            icon="document-text-outline"
            onPress={() => router.push('/admin/contratos')}
          />
        </View>
      </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: taskSpacing.sm,
    paddingBottom: taskSpacing.xl,
  },
  header: {
    marginBottom: taskSpacing.xl,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: HoffColors.primary,
    letterSpacing: -0.3,
  },
  lead: {
    marginTop: taskSpacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: HoffColors.textSecondary,
  },
  list: {
    gap: taskSpacing.md,
  },
});
