import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HoffColors } from '@/constants/theme';

export default function WorkerDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Inicio</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HoffColors.background,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: HoffColors.text,
  },
});

