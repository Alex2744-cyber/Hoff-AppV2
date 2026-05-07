import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { HoffColors } from '@/constants/theme';
import { taskSpacing } from '@/constants/taskUi';

export type InfiniteWheelMode = 'duration' | 'clock';

const NUM_CYCLES = 7;
const DEFAULT_DURATION_CAP_HOURS = 48;

type Props = {
  mode: InfiniteWheelMode;
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  /** Solo modo duration: minutos totales máximos (incl.). Sin límite explícito se usa 48 h. */
  maxTotalMinutes?: number;
  size?: 'large' | 'small';
};

function clampDuration(h: number, m: number, maxTotal: number): { h: number; m: number } {
  let total = h * 60 + m;
  if (total <= maxTotal) return { h, m };
  total = maxTotal;
  const hh = Math.floor(total / 60);
  return { h: hh, m: total - hh * 60 };
}

export function InfiniteWheelTimePicker({
  mode,
  hours,
  minutes,
  onChange,
  maxTotalMinutes,
  size = 'small',
}: Props) {
  const itemHeight = size === 'large' ? 50 : 40;
  const wrapperHeight = size === 'large' ? 200 : 160;
  const wrapperWidth = size === 'large' ? 88 : 64;
  const pad = wrapperHeight / 2 - itemHeight / 2;

  const maxTotal =
    mode === 'duration'
      ? maxTotalMinutes != null && Number.isFinite(maxTotalMinutes)
        ? Math.max(0, Math.floor(maxTotalMinutes))
        : DEFAULT_DURATION_CAP_HOURS * 60
      : 23 * 60 + 59;

  const maxHour =
    mode === 'clock'
      ? 23
      : maxTotalMinutes != null && Number.isFinite(maxTotalMinutes)
        ? Math.min(99, Math.floor(maxTotal / 60))
        : DEFAULT_DURATION_CAP_HOURS;

  const hourCycleLen = maxHour + 1;
  const hourItemCount = hourCycleLen * NUM_CYCLES;
  const minuteItemCount = 60 * NUM_CYCLES;

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const hourScrollYRef = useRef(0);
  const minuteScrollYRef = useRef(0);
  const syncingHourRef = useRef(false);
  const syncingMinuteRef = useRef(false);

  const scrollYForHourIndex = useCallback(
    (index: number) => {
      return pad + index * itemHeight + itemHeight / 2 - wrapperHeight / 2;
    },
    [pad, itemHeight, wrapperHeight]
  );

  const scrollYForMinuteIndex = useCallback(
    (index: number) => {
      return pad + index * itemHeight + itemHeight / 2 - wrapperHeight / 2;
    },
    [pad, itemHeight, wrapperHeight]
  );

  const indexFromScrollY = useCallback(
    (scrollY: number, totalItems: number) => {
      const raw = (scrollY + wrapperHeight / 2 - pad - itemHeight / 2) / itemHeight;
      let idx = Math.round(raw);
      idx = Math.max(0, Math.min(totalItems - 1, idx));
      return idx;
    },
    [wrapperHeight, pad, itemHeight]
  );

  const normalizeHourIndex = useCallback(
    (logicalHour: number) => {
      const mid = Math.floor(NUM_CYCLES / 2);
      return mid * hourCycleLen + logicalHour;
    },
    [hourCycleLen]
  );

  const normalizeMinuteIndex = useCallback((logicalMinute: number) => {
    const mid = Math.floor(NUM_CYCLES / 2);
    return mid * 60 + logicalMinute;
  }, []);

  const maxMinuteForHour = useCallback(
    (h: number) => {
      if (mode === 'clock') return 59;
      return Math.min(59, Math.max(0, maxTotal - h * 60));
    },
    [mode, maxTotal]
  );

  const applyHourFromScroll = useCallback(
    (scrollY: number) => {
      hourScrollYRef.current = scrollY;
      const idx = indexFromScrollY(scrollY, hourItemCount);
      let h = idx % hourCycleLen;
      const minuteIdx = indexFromScrollY(minuteScrollYRef.current, minuteItemCount);
      let m = minuteIdx % 60;
      if (mode === 'duration') {
        const c = clampDuration(h, m, maxTotal);
        h = c.h;
        m = c.m;
      }
      onChange(h, m);
      const norm = normalizeHourIndex(h);
      const y = scrollYForHourIndex(norm);
      if (Math.abs(scrollY - y) > 1) {
        syncingHourRef.current = true;
        hourScrollRef.current?.scrollTo({ y, animated: false });
        requestAnimationFrame(() => {
          syncingHourRef.current = false;
        });
      }
      if (mode === 'duration' && m !== minuteIdx % 60) {
        const ym = scrollYForMinuteIndex(normalizeMinuteIndex(m));
        syncingMinuteRef.current = true;
        minuteScrollRef.current?.scrollTo({ y: ym, animated: true });
        minuteScrollYRef.current = ym;
        requestAnimationFrame(() => {
          syncingMinuteRef.current = false;
        });
      }
    },
    [
      indexFromScrollY,
      hourItemCount,
      hourCycleLen,
      mode,
      maxTotal,
      onChange,
      normalizeHourIndex,
      normalizeMinuteIndex,
      scrollYForHourIndex,
      scrollYForMinuteIndex,
      minuteItemCount,
    ]
  );

  const applyMinuteFromScroll = useCallback(
    (scrollY: number) => {
      minuteScrollYRef.current = scrollY;
      const idx = indexFromScrollY(scrollY, minuteItemCount);
      let m = idx % 60;
      const hourIdx = indexFromScrollY(hourScrollYRef.current, hourItemCount);
      let h = hourIdx % hourCycleLen;
      const hourBefore = h;
      if (mode === 'duration') {
        const c = clampDuration(h, m, maxTotal);
        h = c.h;
        m = c.m;
      }
      onChange(h, m);
      const norm = normalizeMinuteIndex(m);
      const y = scrollYForMinuteIndex(norm);
      if (Math.abs(scrollY - y) > 1) {
        syncingMinuteRef.current = true;
        minuteScrollRef.current?.scrollTo({ y, animated: false });
        requestAnimationFrame(() => {
          syncingMinuteRef.current = false;
        });
      }
      if (mode === 'duration' && h !== hourBefore) {
        const yh = scrollYForHourIndex(normalizeHourIndex(h));
        syncingHourRef.current = true;
        hourScrollRef.current?.scrollTo({ y: yh, animated: true });
        hourScrollYRef.current = yh;
        requestAnimationFrame(() => {
          syncingHourRef.current = false;
        });
      }
    },
    [
      indexFromScrollY,
      minuteItemCount,
      hourItemCount,
      hourCycleLen,
      mode,
      maxTotal,
      onChange,
      normalizeMinuteIndex,
      normalizeHourIndex,
      scrollYForMinuteIndex,
      scrollYForHourIndex,
    ]
  );

  const onHourMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (syncingHourRef.current) return;
      applyHourFromScroll(e.nativeEvent.contentOffset.y);
    },
    [applyHourFromScroll]
  );

  const onMinuteMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (syncingMinuteRef.current) return;
      applyMinuteFromScroll(e.nativeEvent.contentOffset.y);
    },
    [applyMinuteFromScroll]
  );

  /** Solo al montar: el padre debe usar `key` al abrir el modal para reiniciar posición. */
  useLayoutEffect(() => {
    let h = hours;
    let m = minutes;
    if (mode === 'duration') {
      const c = clampDuration(h, m, maxTotal);
      h = c.h;
      m = c.m;
    } else {
      h = Math.max(0, Math.min(23, h));
      m = Math.max(0, Math.min(59, m));
    }
    const hi = normalizeHourIndex(h);
    const mi = normalizeMinuteIndex(m);
    const yh = scrollYForHourIndex(hi);
    const ym = scrollYForMinuteIndex(mi);
    hourScrollYRef.current = yh;
    minuteScrollYRef.current = ym;
    syncingHourRef.current = true;
    syncingMinuteRef.current = true;
    hourScrollRef.current?.scrollTo({ y: yh, animated: false });
    minuteScrollRef.current?.scrollTo({ y: ym, animated: false });
    requestAnimationFrame(() => {
      syncingHourRef.current = false;
      syncingMinuteRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo alinear al montar (key desde el padre)
  }, []);

  const hourRows = useMemo(() => {
    const rows: { key: string; value: number; disabled: boolean }[] = [];
    for (let c = 0; c < NUM_CYCLES; c++) {
      for (let v = 0; v < hourCycleLen; v++) {
        const disabled = mode === 'duration' && v > Math.floor(maxTotal / 60);
        rows.push({ key: `h-${c}-${v}`, value: v, disabled });
      }
    }
    return rows;
  }, [hourCycleLen, mode, maxTotal]);

  const minuteRows = useMemo(() => {
    const rows: { key: string; value: number; disabled: boolean }[] = [];
    const hForLimit = hours;
    for (let c = 0; c < NUM_CYCLES; c++) {
      for (let v = 0; v < 60; v++) {
        const disabled =
          mode === 'duration' && (hForLimit * 60 + v > maxTotal || v > maxMinuteForHour(hForLimit));
        rows.push({ key: `m-${c}-${v}`, value: v, disabled });
      }
    }
    return rows;
  }, [mode, maxTotal, hours, maxMinuteForHour]);

  const slotTop = wrapperHeight / 2 - itemHeight / 2;

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>{mode === 'clock' ? 'Hora' : 'Horas'}</Text>
        <View style={[styles.wrapper, { height: wrapperHeight, width: wrapperWidth }]}>
          <View
            pointerEvents="none"
            style={[styles.slot, { top: slotTop, height: itemHeight }]}
          />
          <ScrollView
            ref={hourScrollRef}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: pad }}
            nestedScrollEnabled
            scrollEventThrottle={16}
            onMomentumScrollEnd={onHourMomentumEnd}
            onScroll={(e) => {
              hourScrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
          >
            {hourRows.map(({ key, value, disabled }) => (
              <View key={key} style={[styles.item, { height: itemHeight }]}>
                <Text
                  style={[
                    styles.itemText,
                    size === 'large' && styles.itemTextLarge,
                    hours === value && styles.itemTextSelected,
                    disabled && styles.itemTextDisabled,
                  ]}
                >
                  {mode === 'clock' ? value.toString().padStart(2, '0') : value}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Min</Text>
        <View style={[styles.wrapper, { height: wrapperHeight, width: wrapperWidth }]}>
          <View
            pointerEvents="none"
            style={[styles.slot, { top: slotTop, height: itemHeight }]}
          />
          <ScrollView
            ref={minuteScrollRef}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: pad }}
            nestedScrollEnabled
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMinuteMomentumEnd}
            onScroll={(e) => {
              minuteScrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
          >
            {minuteRows.map(({ key, value, disabled }) => (
              <View key={key} style={[styles.item, { height: itemHeight }]}>
                <Text
                  style={[
                    styles.itemText,
                    size === 'large' && styles.itemTextLarge,
                    minutes === value && styles.itemTextSelected,
                    disabled && styles.itemTextDisabled,
                  ]}
                >
                  {value.toString().padStart(2, '0')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: taskSpacing.md,
  },
  column: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.xs,
  },
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HoffColors.primary,
    backgroundColor: 'rgba(10, 66, 50, 0.06)',
    zIndex: 1,
  },
  scroll: {
    flex: 1,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  itemTextLarge: {
    fontSize: 20,
  },
  itemTextSelected: {
    color: HoffColors.text,
    fontWeight: '700',
  },
  itemTextDisabled: {
    opacity: 0.25,
  },
});
