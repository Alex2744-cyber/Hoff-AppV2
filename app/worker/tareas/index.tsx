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
          <Text style={styles.heading}>Mis tareas</Text>
          <Text style={styles.lead}>Consulta lo asignado, el estado y el historial.</Text>
        </View>

        <View style={styles.list}>
          <TaskHubLinkRow
            title="Ver tareas"
            subtitle="Pendientes y asignadas a ti"
            icon="clipboard-outline"
            emphasize
            onPress={() => router.push('/worker/tareas/lista')}
          />
          <TaskHubLinkRow
            title="Completadas"
            subtitle="En revisión o devueltas por el administrador"
            icon="hourglass-outline"
            onPress={() => router.push('/worker/tareas/completadas')}
          />
          <TaskHubLinkRow
            title="Trabajos realizados"
            subtitle="Tareas ya aprobadas"
            icon="checkmark-done-outline"
            onPress={() => router.push('/worker/tareas/realizados')}
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
