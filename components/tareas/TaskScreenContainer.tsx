import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HoffColors } from '@/constants/theme';
import { taskContentMaxWidth, taskSpacing } from '@/constants/taskUi';

type Props = {
  children: React.ReactNode;
  /** Padding inferior extra (p.ej. FAB). */
  bottomInsetExtra?: number;
};

export function TaskScreenContainer({ children, bottomInsetExtra = 0 }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontal = width >= taskContentMaxWidth + taskSpacing.lg * 2 ? taskSpacing.xl : taskSpacing.lg;
  const maxW = Math.min(width - horizontal * 2, taskContentMaxWidth);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + taskSpacing.sm,
          paddingBottom: insets.bottom + bottomInsetExtra + taskSpacing.md,
          paddingHorizontal: horizontal,
        },
      ]}
    >
      <View style={[styles.inner, Platform.OS === 'web' && { maxWidth: maxW, width: '100%' as const, alignSelf: 'center' }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
