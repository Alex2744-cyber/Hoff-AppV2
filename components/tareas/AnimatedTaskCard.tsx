import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TaskCard } from './TaskCard';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  index: number;
  children: React.ReactNode;
  onPress?: () => void;
  /** Ancho del ítem (p. ej. px del grid); debe aplicarse al contenedor, no solo al Pressable interno. */
  style?: StyleProp<ViewStyle>;
};

/** Tarjeta de lista con entrada escalonada. */
export function AnimatedTaskCard({ index, children, onPress, style }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 45, 400)).duration(280)}
      style={[styles.item, style]}
    >
      <TaskCard onPress={onPress} style={styles.cardFill}>
        {children}
      </TaskCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    minWidth: 0,
  },
  cardFill: {
    width: '100%',
  },
});
