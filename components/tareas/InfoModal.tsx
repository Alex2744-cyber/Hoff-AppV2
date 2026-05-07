import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HoffColors } from '@/constants/theme';

type InfoModalVariant = 'info' | 'success' | 'warning' | 'error';

type InfoModalProps = {
  visible: boolean;
  title: string;
  message: string;
  variant?: InfoModalVariant;
  primaryText?: string;
  onPrimary: () => void;
};

function getVariantColor(variant: InfoModalVariant): string {
  switch (variant) {
    case 'success':
      return '#2e7d32';
    case 'warning':
      return '#ed6c02';
    case 'error':
      return '#d32f2f';
    case 'info':
    default:
      return HoffColors.primary;
  }
}

export function InfoModal({
  visible,
  title,
  message,
  variant = 'info',
  primaryText = 'Aceptar',
  onPrimary,
}: InfoModalProps) {
  const accentColor = getVariantColor(variant);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onPrimary}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: accentColor }]} onPress={onPrimary}>
            <Text style={styles.primaryText}>{primaryText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: HoffColors.white,
    borderRadius: 14,
    padding: 20,
  },
  accent: {
    width: 44,
    height: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: HoffColors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  primaryButton: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryText: {
    color: HoffColors.white,
    fontWeight: '700',
  },
});
