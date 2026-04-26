import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskSpacing } from '@/constants/taskUi';

type BtnProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function TaskPrimaryButton({ label, onPress, disabled, loading, style, textStyle }: BtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        (pressed || disabled) && styles.primaryPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={HoffColors.primary} />
      ) : (
        <Text style={[styles.primaryText, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function TaskSecondaryButton({ label, onPress, disabled, loading, style, textStyle }: BtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.secondary,
        (pressed || disabled) && styles.secondaryPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={HoffColors.textSecondary} />
      ) : (
        <Text style={[styles.secondaryText, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 48,
    paddingVertical: taskSpacing.md,
    paddingHorizontal: taskSpacing.lg,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: {
    opacity: 0.88,
    backgroundColor: HoffColors.accentDark,
  },
  primaryText: {
    color: HoffColors.primaryDark,
    fontWeight: '700',
    fontSize: 16,
  },
  secondary: {
    minHeight: 48,
    paddingVertical: taskSpacing.md,
    paddingHorizontal: taskSpacing.lg,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.surface,
    borderWidth: 1,
    borderColor: HoffColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    opacity: 0.85,
    backgroundColor: HoffColors.background,
  },
  secondaryText: {
    color: HoffColors.text,
    fontWeight: '600',
    fontSize: 16,
  },
});
