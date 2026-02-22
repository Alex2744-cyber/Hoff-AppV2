import { Stack } from 'expo-router';
import React from 'react';

export default function TareasLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#4CAF50',
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
          title: 'Mis Tareas',
        }}
      />
      <Stack.Screen
        name="detalle"
        options={{
          title: 'Detalle de Tarea',
        }}
      />
      <Stack.Screen
        name="lista"
        options={{
          title: 'Mis Tareas Asignadas',
        }}
      />
      <Stack.Screen
        name="completadas"
        options={{
          title: 'Tareas Completadas',
        }}
      />
      <Stack.Screen
        name="realizados"
        options={{
          title: 'Trabajos Realizados',
        }}
      />
    </Stack>
  );
}

