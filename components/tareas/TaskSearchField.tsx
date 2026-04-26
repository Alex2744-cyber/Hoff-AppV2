import React from 'react';
import { View, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskSpacing } from '@/constants/taskUi';

type Props = TextInputProps;

export function TaskSearchField({ style, ...rest }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name="search-outline" size={20} color={HoffColors.textMuted} style={styles.icon} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={HoffColors.textMuted}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HoffColors.background,
    borderRadius: taskRadius.md,
    paddingHorizontal: taskSpacing.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
    minHeight: 48,
  },
  icon: {
    marginRight: taskSpacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: HoffColors.text,
  },
});
