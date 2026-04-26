import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HoffColors } from '@/constants/theme';
import { taskSpacing } from '@/constants/taskUi';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  icon?: IconName;
  value?: string;
  children?: React.ReactNode;
  /** Valor alineado a la derecha (por defecto). Si es false, el valor va debajo de la etiqueta. */
  inline?: boolean;
  valueStyle?: TextStyle;
};

export function TaskDetailRow({
  label,
  icon,
  value,
  children,
  inline = true,
  valueStyle,
}: Props) {
  const valueNode =
    children ??
    (value != null ? (
      <Text style={[styles.value, !inline && styles.valueBlock, valueStyle]}>{value}</Text>
    ) : null);

  if (!inline) {
    return (
      <View style={styles.block}>
        <View style={styles.labelRow}>
          {icon ? (
            <Ionicons name={icon} size={18} color={HoffColors.textSecondary} style={styles.icon} />
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        {valueNode}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.labelCell}>
        {icon ? (
          <Ionicons name={icon} size={18} color={HoffColors.textSecondary} style={styles.icon} />
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueCell}>{valueNode}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: taskSpacing.sm,
    paddingVertical: taskSpacing.xs,
    marginBottom: taskSpacing.xs,
  },
  block: {
    marginBottom: taskSpacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
    marginBottom: taskSpacing.xs,
  },
  labelCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '48%',
    gap: taskSpacing.sm,
  },
  valueCell: {
    flex: 1,
    alignItems: 'flex-end',
  },
  icon: {
    marginRight: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: HoffColors.text,
    textAlign: 'right',
    lineHeight: 20,
  },
  valueBlock: {
    textAlign: 'left',
    alignSelf: 'stretch',
  },
});
