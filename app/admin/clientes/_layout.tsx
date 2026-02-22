import { Stack } from 'expo-router';
import React from 'react';

export default function ClientesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
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
    </Stack>
  );
}

