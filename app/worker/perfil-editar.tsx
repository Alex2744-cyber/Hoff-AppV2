import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { ProfileEditorSection } from '@/components/perfil/ProfileEditorSection';
import { taskSpacing } from '@/constants/taskUi';

export default function PerfilEditarWorkerScreen() {
  return (
    <TaskScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ProfileEditorSection mediaTipo="trabajador_perfil" />
      </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: taskSpacing.xxl },
});
