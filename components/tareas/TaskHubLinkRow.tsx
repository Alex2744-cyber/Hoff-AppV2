import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskShadowCard, taskSpacing } from '@/constants/taskUi';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
  /** Fondo del círculo del icono ligeramente más marcado (p. ej. primera acción). */
  emphasize?: boolean;
};

export function TaskHubLinkRow({ title, subtitle, icon, onPress, emphasize }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={[styles.iconCircle, emphasize && styles.iconCircleEmphasize]}>
        <Ionicons name={icon} size={24} color={emphasize ? HoffColors.primaryDark : HoffColors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={HoffColors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    paddingVertical: taskSpacing.md,
    paddingHorizontal: taskSpacing.lg,
    gap: taskSpacing.md,
    ...taskShadowCard,
  },
  cardPressed: {
    opacity: Platform.OS === 'web' ? 0.92 : 0.88,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: HoffColors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleEmphasize: {
    backgroundColor: HoffColors.accent,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: HoffColors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: HoffColors.textSecondary,
    lineHeight: 18,
  },
});
