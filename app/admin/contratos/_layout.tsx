import { Stack } from 'expo-router';
import React from 'react';
import { HoffColors } from '@/constants/theme';

export default function ContratosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: HoffColors.primary },
        headerTintColor: HoffColors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Contratos' }} />
      <Stack.Screen name="detalle" options={{ title: 'Detalle de contrato' }} />
      <Stack.Screen name="editar" options={{ title: 'Editar contrato' }} />
    </Stack>
  );
}
