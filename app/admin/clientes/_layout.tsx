import { Stack } from 'expo-router';
import React from 'react';
import { HoffColors } from '@/constants/theme';

export default function ClientesLayout() {
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
          title: 'Clientes',
        }}
      />
      <Stack.Screen
        name="detalle"
        options={{
          title: 'Cliente',
        }}
      />
      <Stack.Screen
        name="crear"
        options={{
          title: 'Crear Cliente',
        }}
      />
      <Stack.Screen
        name="editar"
        options={{
          title: 'Editar Cliente',
        }}
      />
      <Stack.Screen
        name="direcciones"
        options={{
          title: 'Direcciones',
        }}
      />
    </Stack>
  );
}
