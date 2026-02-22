import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';

export type TabBarIconName =
  | 'home'
  | 'workers'
  | 'clients'
  | 'tasks'
  | 'finance'
  | 'person'
  | 'list';

const IONICON_NAMES: Record<TabBarIconName, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  workers: 'people-outline',
  clients: 'business-outline',
  tasks: 'list-outline',
  finance: 'wallet-outline',
  person: 'person-outline',
  list: 'list-outline',
};

export function TabBarIcon({
  name,
  color,
  size,
}: {
  name: TabBarIconName;
  color: string;
  size: number;
}) {
  const iconName = IONICON_NAMES[name] ?? 'ellipse-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
}
