import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskShadowCard, taskSpacing } from '@/constants/taskUi';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: React.ReactNode;
};

export function TaskFiltersPanel({
  visible,
  title = 'Filtros',
  onClose,
  onReset,
  onApply,
  children,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name="options-outline" size={18} color={HoffColors.primary} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar filtros">
              <Ionicons name="close" size={22} color={HoffColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>{children}</View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
              <Text style={styles.resetBtnText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: taskSpacing.lg,
  },
  sheet: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    padding: taskSpacing.lg,
    ...taskShadowCard,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: taskSpacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: HoffColors.text,
  },
  content: {
    gap: taskSpacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: taskSpacing.md,
    marginTop: taskSpacing.lg,
  },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.background,
    alignItems: 'center',
    paddingVertical: taskSpacing.md,
  },
  resetBtnText: {
    color: HoffColors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.primary,
    alignItems: 'center',
    paddingVertical: taskSpacing.md,
  },
  applyBtnText: {
    color: HoffColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
