import { Stack } from 'expo-router';
import React from 'react';
import { HoffColors } from '@/constants/theme';

export default function TareasLayout() {
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
        name="editar"
        options={{
          title: 'Editar Tarea',
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

