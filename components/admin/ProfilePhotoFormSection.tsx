import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { ClienteAvatar } from '@/components/clientes/ClienteAvatar';
import { pickAndUploadProfilePhoto, type ProfileMediaTipo } from '@/utils/mediaUpload';

type Props = {
  displayName: string;
  fotoUrl: string;
  onFotoUrlChange: (url: string) => void;
  mediaTipo: ProfileMediaTipo;
  /** Sin tarjeta anidada (útil dentro de un bloque que ya es card) */
  variant?: 'card' | 'embedded';
};

export function ProfilePhotoFormSection({
  displayName,
  fotoUrl,
  onFotoUrlChange,
  mediaTipo,
  variant = 'card',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const handlePick = async () => {
    try {
      setUploading(true);
      const url = await pickAndUploadProfilePhoto(mediaTipo);
      if (url) {
        onFotoUrlChange(url);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo subir la imagen';
      Alert.alert('Error', msg);
    } finally {
      setUploading(false);
    }
  };

  const rootStyle = variant === 'embedded' ? styles.embeddedRoot : styles.card;

  return (
    <View style={rootStyle}>
      <Text style={styles.sectionHeading}>Foto de perfil</Text>
      <View style={styles.previewRow}>
        <ClienteAvatar nombre={displayName || '?'} fotoUri={fotoUrl || undefined} size={72} />
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, uploading && styles.btnDisabled]}
            onPress={handlePick}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={HoffColors.primary} size="small" />
            ) : (
              <Text style={styles.secondaryBtnText}>Elegir imagen</Text>
            )}
          </TouchableOpacity>
          {!!fotoUrl && (
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => onFotoUrlChange('')}
              disabled={uploading}
            >
              <Text style={styles.linkBtnText}>Quitar foto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.helperText}>
        La imagen se guarda en el servidor. Formatos: JPG, PNG o WEBP (máx. según configuración del
        API).
      </Text>
      <TouchableOpacity onPress={() => setShowManualUrl((v) => !v)}>
        <Text style={styles.toggleAdvanced}>
          {showManualUrl ? 'Ocultar URL manual' : 'Usar URL manual (avanzado)'}
        </Text>
      </TouchableOpacity>
      {showManualUrl && (
        <>
          <Text style={styles.label}>URL HTTPS</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={HoffColors.textMuted}
            value={fotoUrl}
            onChangeText={onFotoUrlChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    marginBottom: taskSpacing.md,
  },
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginBottom: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: HoffColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: taskSpacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.lg,
    marginBottom: taskSpacing.sm,
  },
  previewActions: {
    flex: 1,
    gap: taskSpacing.sm,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: HoffColors.primary,
    borderRadius: taskRadius.md,
    paddingVertical: taskSpacing.sm,
    paddingHorizontal: taskSpacing.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  secondaryBtnText: {
    color: HoffColors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  linkBtn: {
    paddingVertical: 4,
  },
  linkBtnText: {
    color: HoffColors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  helperText: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.sm,
    lineHeight: 18,
  },
  toggleAdvanced: {
    fontSize: 13,
    color: HoffColors.primary,
    fontWeight: '600',
    marginBottom: taskSpacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    color: HoffColors.text,
    backgroundColor: HoffColors.surface,
  },
});
