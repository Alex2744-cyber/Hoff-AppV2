import { Stack } from 'expo-router';
import React from 'react';

export default function TareasLayout() {
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
          title: 'Gestión de Tareas',
        }}
      />
      <Stack.Screen
        name="crear"
        options={{
          title: 'Crear Nueva Tarea',
        }}
      />
      <Stack.Screen
        name="lista"
        options={{
          title: 'Todas las Tareas',
        }}
      />
      <Stack.Screen
        name="detalle"
        options={{
          title: 'Detalle de Tarea',
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

