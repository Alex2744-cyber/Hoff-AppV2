import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';
import { HoffColors } from '@/constants/theme';

const NAV_LOADING_DURATION_MS = 380;

export function LoadingOverlay() {
  const { isNavigating } = useNavigationLoading();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isNavigating ? 1 : 0, {
      duration: isNavigating ? 150 : 200,
    });
  }, [isNavigating, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.overlay, animatedStyle]}
      pointerEvents={isNavigating ? 'auto' : 'none'}
      collapsable={false}
    >
      <View style={styles.box}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={HoffColors.accent} style={styles.spinner} />
        <Text style={styles.label}>Cargando...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HoffColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: HoffColors.white,
    fontWeight: '600',
  },
});
