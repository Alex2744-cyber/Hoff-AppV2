import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { HoffColors } from '@/constants/theme';

interface TimePickerProps {
  horas: number;
  minutos: number;
  onHorasChange: (horas: number) => void;
  onMinutosChange: (minutos: number) => void;
  maxHoras?: number;
  maxMinutos?: number;
  minHoras?: number;
  size?: 'large' | 'small';
}

export function TimePicker({
  horas,
  minutos,
  onHorasChange,
  onMinutosChange,
  maxHoras,
  maxMinutos,
  minHoras = 0,
  size = 'large',
}: TimePickerProps) {
  const horasScrollRef = React.useRef<ScrollView>(null);
  const minutosScrollRef = React.useRef<ScrollView>(null);

  const maxTotalMinutos =
    maxHoras !== undefined && maxMinutos !== undefined ? maxHoras * 60 + maxMinutos : undefined;

  const isDisabled = (h: number, m: number): boolean => {
    if (h < minHoras) return true;
    if (maxTotalMinutos === undefined) return false;
    const totalMin = h * 60 + m;
    return totalMin > maxTotalMinutos;
  };

  const horasRange = 25; // 0-24
  const minutosRange = 60; // 0-59

  const itemHeight = size === 'large' ? 50 : 40;
  const wrapperHeight = size === 'large' ? 200 : 120;
  const wrapperWidth = size === 'large' ? 100 : 60;

  React.useEffect(() => {
    const scrollToHoras = Math.max(0, horas) * itemHeight;
    horasScrollRef.current?.scrollTo({
      y: scrollToHoras,
      animated: true,
    });
  }, [horas, itemHeight]);

  React.useEffect(() => {
    const scrollToMinutos = Math.max(0, minutos) * itemHeight;
    minutosScrollRef.current?.scrollTo({
      y: scrollToMinutos,
      animated: true,
    });
  }, [minutos, itemHeight]);

  const slotTop = wrapperHeight / 2 - itemHeight / 2;

  return (
    <View style={styles.timePickerContainer}>
      <View style={styles.timePickerColumn}>
        <Text style={styles.timePickerLabel}>Horas</Text>
        <View
          style={[styles.timePickerWrapper, { height: wrapperHeight, width: wrapperWidth }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        >
          <View
            pointerEvents="none"
            style={[styles.timePickerSlotHighlight, { top: slotTop, height: itemHeight }]}
          />
          <ScrollView
            ref={horasScrollRef}
            style={styles.timePickerScroll}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: wrapperHeight / 2 - itemHeight / 2 }}
            nestedScrollEnabled
            scrollEventThrottle={16}
          >
            {Array.from({ length: horasRange }, (_, i) => i).map((h) => {
              const disabled = isDisabled(h, minutos);
              return (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.timePickerItem,
                    { height: itemHeight },
                    horas === h && styles.timePickerItemSelected,
                    disabled && styles.timePickerItemDisabled,
                  ]}
                  onPress={() => !disabled && onHorasChange(h)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      size === 'large' && styles.timePickerItemTextLarge,
                      horas === h && styles.timePickerItemTextSelected,
                      disabled && styles.timePickerItemTextDisabled,
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={styles.timePickerColumn}>
        <Text style={styles.timePickerLabel}>Minutos</Text>
        <View
          style={[styles.timePickerWrapper, { height: wrapperHeight, width: wrapperWidth }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        >
          <View
            pointerEvents="none"
            style={[styles.timePickerSlotHighlight, { top: slotTop, height: itemHeight }]}
          />
          <ScrollView
            ref={minutosScrollRef}
            style={styles.timePickerScroll}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: wrapperHeight / 2 - itemHeight / 2 }}
            nestedScrollEnabled
            scrollEventThrottle={16}
          >
            {Array.from({ length: minutosRange }, (_, i) => i).map((m) => {
              const disabled = isDisabled(horas, m);
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.timePickerItem,
                    { height: itemHeight },
                    minutos === m && styles.timePickerItemSelected,
                    disabled && styles.timePickerItemDisabled,
                  ]}
                  onPress={() => !disabled && onMinutosChange(m)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      size === 'large' && styles.timePickerItemTextLarge,
                      minutos === m && styles.timePickerItemTextSelected,
                      disabled && styles.timePickerItemTextDisabled,
                    ]}
                  >
                    {m.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  timePickerColumn: {
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 8,
  },
  timePickerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  timePickerSlotHighlight: {
    position: 'absolute',
    left: 6,
    right: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: HoffColors.primary,
    backgroundColor: 'rgba(10,66,50,0.08)',
    zIndex: 2,
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 6,
  },
  timePickerItemSelected: {
    backgroundColor: 'transparent',
  },
  timePickerItemDisabled: {
    opacity: 0.35,
  },
  timePickerItemText: {
    fontSize: 18,
    color: HoffColors.textSecondary,
    fontWeight: '500',
  },
  timePickerItemTextLarge: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  timePickerItemTextSelected: {
    color: HoffColors.primaryDark,
    fontWeight: 'bold',
  },
  timePickerItemTextDisabled: {
    color: HoffColors.textMuted,
  },
});
