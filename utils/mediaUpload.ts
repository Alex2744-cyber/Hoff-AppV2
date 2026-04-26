import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';

export type ProfileMediaTipo = 'cliente_perfil' | 'trabajador_perfil' | 'admin_perfil';
export type TaskMediaTipo = 'tarea_evidencia';

/** Alineado con el backend: máximo de imágenes por tarea. */
export const MAX_TAREA_EVIDENCIAS = 5;

export async function pickProfileImageFromLibrary(): Promise<{
  uri: string;
  mimeType: string;
  fileName: string;
} | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permisos', 'Se necesita acceso a la galería para elegir una imagen.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType || 'image/jpeg',
    fileName: a.fileName || 'photo.jpg',
  };
}

export async function pickTaskEvidenceFromLibrary(): Promise<{
  uri: string;
  mimeType: string;
  fileName: string;
} | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permisos', 'Se necesita acceso a la galeria para elegir una imagen.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType || 'image/jpeg',
    fileName: a.fileName || `evidencia-${Date.now()}.jpg`,
  };
}

/**
 * Añade hasta `remaining` fotos desde galería (selección múltiple si el dispositivo lo permite).
 */
export async function pickTaskEvidencesFromLibrary(remaining: number): Promise<
  { uri: string; mimeType: string; fileName: string }[]
> {
  if (remaining < 1) {
    return [];
  }
  const cap = Math.min(remaining, MAX_TAREA_EVIDENCIAS);
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permisos', 'Se necesita acceso a la galeria para elegir imagenes.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: cap,
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map((a, i) => ({
    uri: a.uri,
    mimeType: a.mimeType || 'image/jpeg',
    fileName: a.fileName || `evidencia-${Date.now()}-${i}.jpg`,
  }));
}

export async function uploadProfilePhoto(
  tipo: ProfileMediaTipo,
  asset: { uri: string; mimeType: string; fileName: string }
): Promise<string> {
  const form = new FormData();
  form.append('tipo', tipo);

  if (Platform.OS === 'web') {
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    form.append('file', blob, asset.fileName || 'photo.jpg');
  } else {
    form.append(
      'file',
      {
        uri: asset.uri,
        name: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob
    );
  }

  const out = await api.uploadMedia(form);
  if (!out.success || !out.data?.url) {
    throw new Error(out.error || 'No se obtuvo URL de la imagen');
  }
  return out.data.url;
}

export async function uploadTaskEvidence(
  tipo: TaskMediaTipo,
  asset: { uri: string; mimeType: string; fileName: string }
): Promise<{ url: string; path: string }> {
  const form = new FormData();
  form.append('tipo', tipo);

  if (Platform.OS === 'web') {
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    form.append('file', blob, asset.fileName || 'evidencia.jpg');
  } else {
    form.append(
      'file',
      {
        uri: asset.uri,
        name: asset.fileName || 'evidencia.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob
    );
  }

  const out = await api.uploadMedia(form);
  if (!out.success || !out.data?.url || !out.data?.path) {
    throw new Error(out.error || 'No se obtuvo la evidencia subida');
  }
  return { url: out.data.url, path: out.data.path };
}

export async function pickAndUploadProfilePhoto(
  tipo: ProfileMediaTipo
): Promise<string | null> {
  const asset = await pickProfileImageFromLibrary();
  if (!asset) {
    return null;
  }
  return uploadProfilePhoto(tipo, asset);
}
