import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HoffColors } from '@/constants/theme';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (loading) return;
        onCancel();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                destructive ? styles.destructiveButton : styles.confirmButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={HoffColors.white} />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
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
    backgroundColor: HoffColors.white,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 460,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: HoffColors.text,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: HoffColors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  cancelText: {
    color: HoffColors.text,
    fontWeight: '700',
  },
  confirmText: {
    color: HoffColors.white,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
