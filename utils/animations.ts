import { withTiming, withSpring } from 'react-native-reanimated';

export const DURATION_FAST = 150;
export const DURATION_NORMAL = 280;
export const DURATION_SLOW = 400;

export const springConfig = {
  damping: 15,
  stiffness: 150,
};

export function entranceFadeIn(duration = DURATION_NORMAL) {
  'worklet';
  return withTiming(1, { duration });
}

export function entranceScale(duration = DURATION_NORMAL) {
  'worklet';
  return withSpring(1, springConfig);
}
