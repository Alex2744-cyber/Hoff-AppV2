import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskShadowCard, taskSpacing } from '@/constants/taskUi';

type Props = {
  title: string;
  children: React.ReactNode;
  /** Sin sombra (bloques anidados). */
  plain?: boolean;
};

export function TaskSection({ title, children, plain }: Props) {
  return (
    <View style={[styles.card, plain && styles.cardPlain]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginBottom: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  cardPlain: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
    padding: 0,
    marginBottom: taskSpacing.md,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: HoffColors.primary,
    marginBottom: taskSpacing.md,
  },
});
