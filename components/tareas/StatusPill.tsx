import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskSpacing } from '@/constants/taskUi';

type Props = {
  label: string;
  backgroundColor: string;
};

export function StatusPill({ label, backgroundColor }: Props) {
  return (
    <View style={[styles.row, { backgroundColor }]}>
      <View style={styles.dot} />
      <Text style={[styles.text, { marginLeft: taskSpacing.sm }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: taskSpacing.md,
    paddingVertical: taskSpacing.sm,
    borderRadius: taskRadius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HoffColors.white,
    opacity: 0.9,
  },
  text: {
    color: HoffColors.white,
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
});
