import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { HoffColors } from '@/constants/theme';

/** Espaciado consistente (tareas). */
export const taskSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const taskRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Ancho máximo del contenido en tablets / web. */
export const taskContentMaxWidth = 640;

/** Ancho mínimo del área de grid (tras padding del scroll) para pasar a 2 columnas. */
export const taskListTwoColumnMinInnerWidth = 560;

/**
 * Ancho fijo en px para tarjetas de listas de tareas (evita % mal resueltos en RN Web).
 * Debe coincidir con `scrollContent`: padding horizontal `taskSpacing.lg` y `maxWidth: taskContentMaxWidth`.
 */
export function getTaskListCardLayout(windowWidth: number): { cardWidth: number; twoColumns: boolean } {
  const gap = taskSpacing.md;
  const horizontalPad = taskSpacing.lg * 2;
  const contentWidth = Math.min(windowWidth, taskContentMaxWidth);
  const gridInner = Math.max(0, contentWidth - horizontalPad);
  const twoColumns = gridInner >= taskListTwoColumnMinInnerWidth;
  const cardWidth = twoColumns ? Math.floor((gridInner - gap) / 2) : gridInner;
  return { cardWidth, twoColumns };
}

/** Sombra tipo tarjeta (iOS/web + Android elevation). */
export const taskShadowCard: ViewStyle = Platform.select({
  web: {
    boxShadow: `0 2px 12px rgba(10, 66, 50, 0.12)`,
  },
  default: {
    shadowColor: HoffColors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
}) as ViewStyle;

export const taskShadowSoft: ViewStyle = Platform.select({
  web: {
    boxShadow: `0 1px 6px rgba(0, 0, 0, 0.08)`,
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
}) as ViewStyle;

/** Franja superior (búsqueda / filtros): fondo ancho completo, borde inferior. */
export const taskToolbarStrip: ViewStyle = {
  width: '100%',
  backgroundColor: HoffColors.surface,
  borderBottomWidth: 1,
  borderBottomColor: HoffColors.border,
};

/**
 * Contenido alineado al mismo ancho que el grid de tarjetas (`scrollContent`).
 */
export const taskToolbarColumn: ViewStyle = {
  maxWidth: taskContentMaxWidth,
  width: '100%',
  alignSelf: 'center',
  paddingHorizontal: taskSpacing.lg,
};

/** Estilos compartidos para chips de filtro (listas, completadas, realizados). */
export const taskFilterChipStyles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: taskSpacing.md,
    borderRadius: taskRadius.full,
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.border,
    marginRight: taskSpacing.sm,
  },
  chipActive: {
    backgroundColor: HoffColors.primary,
    borderColor: HoffColors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  chipTextActive: {
    color: HoffColors.white,
  },
});

export const taskFilterSectionLabel: TextStyle = {
  fontSize: 13,
  fontWeight: '600',
  color: HoffColors.textSecondary,
  marginBottom: taskSpacing.sm,
};
