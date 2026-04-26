import { Stack } from 'expo-router';
import React from 'react';
import { HoffColors } from '@/constants/theme';

export default function TrabajadoresLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: HoffColors.primary,
        },
        headerTintColor: HoffColors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Trabajadores',
        }}
      />
      <Stack.Screen
        name="detalle"
        options={{
          title: 'Detalle del Trabajador',
        }}
      />
      <Stack.Screen
        name="estadisticas"
        options={{
          title: 'Estadísticas Detalladas',
        }}
      />
      <Stack.Screen
        name="crear"
        options={{
          title: 'Nuevo trabajador',
        }}
      />
    </Stack>
  );
}

