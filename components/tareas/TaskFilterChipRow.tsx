import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { taskFilterChipStyles, taskSpacing } from '@/constants/taskUi';

export type TaskFilterChipItem = {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
};

type Props = {
  chips: TaskFilterChipItem[];
  contentContainerStyle?: ViewStyle;
};

const spring = { damping: 18, stiffness: 320 };

function AnimatedChip({ label, active, onPress }: Omit<TaskFilterChipItem, 'key'>) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          taskFilterChipStyles.chip,
          active && taskFilterChipStyles.chipActive,
          animatedStyle,
        ]}
      >
        <Text
          style={[taskFilterChipStyles.chipText, active && taskFilterChipStyles.chipTextActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function TaskFilterChipRow({ chips, contentContainerStyle }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
    >
      {chips.map((c) => (
        <AnimatedChip key={c.key} label={c.label} active={c.active} onPress={c.onPress} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: taskSpacing.lg,
  },
});
