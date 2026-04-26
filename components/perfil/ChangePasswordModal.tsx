import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';

const MIN_LEN = 6;

function crossAlert(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  usuario?: string | null;
};

export function ChangePasswordModal({ visible, onClose, usuario }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setSaving(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!current || !next || !confirm) {
      crossAlert('Error', 'Completa todos los campos');
      return;
    }
    if (next.length < MIN_LEN) {
      crossAlert('Error', `La contraseña nueva debe tener al menos ${MIN_LEN} caracteres`);
      return;
    }
    if (next !== confirm) {
      crossAlert('Error', 'La nueva contraseña y la confirmación no coinciden');
      return;
    }
    setSaving(true);
    try {
      const res = await api.changePassword({
        password_actual: current,
        password_nueva: next,
      });
      if (res.success) {
        crossAlert('Listo', 'Tu contraseña se ha actualizado correctamente.');
        onClose();
      } else {
        crossAlert('Error', res.error || 'No se pudo actualizar');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error de red';
      crossAlert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Ionicons name="key-outline" size={22} color={HoffColors.primary} />
              <Text style={styles.sheetTitle}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={26} color={HoffColors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Usuario: @{usuario || '—'}</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollInner}
            >
              <Text style={styles.label}>Contraseña actual</Text>
              <TextInput
                style={styles.input}
                value={current}
                onChangeText={setCurrent}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Contraseña actual"
                placeholderTextColor={HoffColors.textMuted}
              />

              <Text style={styles.label}>Contraseña nueva</Text>
              <TextInput
                style={styles.input}
                value={next}
                onChangeText={setNext}
                secureTextEntry
                autoCapitalize="none"
                placeholder={`Mínimo ${MIN_LEN} caracteres`}
                placeholderTextColor={HoffColors.textMuted}
              />

              <Text style={styles.label}>Confirmar contraseña nueva</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Repite la nueva contraseña"
                placeholderTextColor={HoffColors.textMuted}
              />

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={HoffColors.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: taskSpacing.lg,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    maxHeight: '90%',
    zIndex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    ...taskShadowCard,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.sm,
    paddingHorizontal: taskSpacing.lg,
    paddingTop: taskSpacing.lg,
    paddingBottom: taskSpacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: HoffColors.text,
  },
  hint: {
    paddingHorizontal: taskSpacing.lg,
    paddingBottom: taskSpacing.md,
    fontSize: 13,
    color: HoffColors.textMuted,
  },
  scrollInner: {
    paddingHorizontal: taskSpacing.lg,
    paddingBottom: taskSpacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: taskSpacing.xs,
    marginTop: taskSpacing.sm,
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
  actions: {
    flexDirection: 'row',
    gap: taskSpacing.md,
    marginTop: taskSpacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: taskSpacing.md,
    borderRadius: taskRadius.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    backgroundColor: HoffColors.background,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: taskSpacing.md,
    borderRadius: taskRadius.lg,
    backgroundColor: HoffColors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: HoffColors.white,
  },
});
