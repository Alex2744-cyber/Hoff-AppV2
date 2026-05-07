import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { taskRadius, taskShadowCard, taskSpacing } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';

export default function ContratoEditarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');

  useEffect(() => {
    (async () => {
      const res = await api.getContratoById(Number(id));
      if (res.success && res.data) {
        setDescripcion(res.data.descripcion_contrato || '');
        setValor(String(res.data.valor_contrato ?? '0'));
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <TaskScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color={HoffColors.primary} />
        </View>
      </TaskScreenContainer>
    );
  }

  return (
    <TaskScreenContainer>
      <View style={styles.card}>
        <Text style={styles.label}>Descripción del contrato</Text>
        <TextInput style={styles.textArea} multiline numberOfLines={4} value={descripcion} onChangeText={setDescripcion} />
        <Text style={styles.label}>Valor del contrato (€)</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={async () => {
            setSaving(true);
            const res = await api.updateContrato(Number(id), {
              descripcion_contrato: descripcion,
              valor_contrato: Number(valor),
            });
            setSaving(false);
            if (res.success) router.back();
          }}
        >
          <Text style={styles.saveBtnText}>Guardar cambios</Text>
        </TouchableOpacity>
      </View>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  label: { fontSize: 14, fontWeight: '600', color: HoffColors.text, marginBottom: taskSpacing.xs, marginTop: taskSpacing.md },
  input: {
    borderWidth: 1, borderColor: HoffColors.border, borderRadius: taskRadius.sm, padding: taskSpacing.md, color: HoffColors.text,
  },
  textArea: {
    borderWidth: 1, borderColor: HoffColors.border, borderRadius: taskRadius.sm, padding: taskSpacing.md, color: HoffColors.text, minHeight: 100,
  },
  saveBtn: {
    marginTop: taskSpacing.lg, backgroundColor: HoffColors.primary, borderRadius: taskRadius.sm, paddingVertical: taskSpacing.md, alignItems: 'center',
  },
  saveBtnText: { color: HoffColors.white, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
