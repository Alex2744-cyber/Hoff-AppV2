import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { InfoModal } from '@/components/tareas';
import { buildDireccionCompleta } from '@/utils/buildDireccionCompleta';

export default function ClienteDireccionesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [showDireccionModal, setShowDireccionModal] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState<any | null>(null);

  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [piso, setPiso] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [provincia, setProvincia] = useState('');
  const [pais, setPais] = useState('United Kingdom');
  const [notasDireccion, setNotasDireccion] = useState('');
  const [savingDireccion, setSavingDireccion] = useState(false);
  const [deleteDireccionId, setDeleteDireccionId] = useState<number | null>(null);
  const [deletingDireccion, setDeletingDireccion] = useState(false);
  const [infoModal, setInfoModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const openInfoModal = (
    title: string,
    message: string,
    variant: 'info' | 'success' | 'warning' | 'error' = 'info',
    onClose?: () => void
  ) => {
    setInfoModal({ visible: true, title, message, variant, onClose });
  };

  const closeInfoModal = () => {
    const cb = infoModal.onClose;
    setInfoModal((prev) => ({ ...prev, visible: false, onClose: undefined }));
    if (cb) cb();
  };

  const loadDirecciones = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingDirecciones(true);
      const response = await api.getDireccionesByCliente(Number(id));
      if (response.success) {
        setDirecciones(response.data || []);
      }
    } catch (e) {
      console.error('Error cargando direcciones:', e);
    } finally {
      setLoadingDirecciones(false);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      loadDirecciones();
    }
  }, [id, loadDirecciones]);

  useFocusEffect(
    useCallback(() => {
      if (id) loadDirecciones();
    }, [id, loadDirecciones])
  );

  const formatearCodigoPostalUK = (text: string): string => {
    const limpio = text.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase();
    const sinEspacios = limpio.replace(/\s+/g, '');
    const limitado = sinEspacios.slice(0, 8);
    if (limitado.length <= 3) return limitado;
    return `${limitado.slice(0, -3)} ${limitado.slice(-3)}`;
  };

  const previewLine = useMemo(
    () =>
      buildDireccionCompleta({
        calle,
        numero,
        piso,
        ciudad,
        codigo_postal: codigoPostal,
        provincia,
        pais,
      }),
    [calle, numero, piso, ciudad, codigoPostal, provincia, pais]
  );

  const openDireccionModal = useCallback((direccion?: any) => {
    if (direccion) {
      setEditingDireccion(direccion);
      setCalle(direccion.calle || '');
      setNumero(direccion.numero || '');
      setPiso(direccion.piso || '');
      setCiudad(direccion.ciudad || '');
      setCodigoPostal(direccion.codigo_postal || '');
      setProvincia(direccion.provincia || '');
      setPais(direccion.pais || 'United Kingdom');
      setNotasDireccion(direccion.notas || '');
    } else {
      setEditingDireccion(null);
      setCalle('');
      setNumero('');
      setPiso('');
      setCiudad('');
      setCodigoPostal('');
      setProvincia('');
      setPais('United Kingdom');
      setNotasDireccion('');
    }
    setShowDireccionModal(true);
  }, []);

  const closeDireccionModal = () => {
    setShowDireccionModal(false);
    setEditingDireccion(null);
  };

  const handleSaveDireccion = async () => {
    if (!calle.trim() || !ciudad.trim()) {
      openInfoModal('Error', 'La calle y la ciudad son obligatorias.', 'error');
      return;
    }

    setSavingDireccion(true);

    try {
      const direccionData = {
        cliente_id: Number(id),
        calle: calle.trim(),
        numero: numero.trim() || null,
        piso: piso.trim() || null,
        ciudad: ciudad.trim(),
        codigo_postal: codigoPostal.trim() || null,
        provincia: provincia.trim() || null,
        pais: pais.trim() || 'United Kingdom',
        notas: notasDireccion.trim() || null,
      };

      let response;
      if (editingDireccion) {
        response = await api.updateDireccion(editingDireccion.id, direccionData);
      } else {
        response = await api.createDireccion(direccionData);
      }

      if (response.success) {
        closeDireccionModal();
        await loadDirecciones();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar la dirección';
      openInfoModal('Error', msg, 'error');
    } finally {
      setSavingDireccion(false);
    }
  };

  const closeDeleteDireccionModal = () => {
    if (!deletingDireccion) setDeleteDireccionId(null);
  };

  const confirmDeleteDireccion = async () => {
    if (deleteDireccionId === null) return;
    setDeletingDireccion(true);
    try {
      const response = await api.deleteDireccion(deleteDireccionId);
      if (response.success) {
        setDeleteDireccionId(null);
        await loadDirecciones();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo eliminar la dirección';
      openInfoModal('Error', msg, 'error');
    } finally {
      setDeletingDireccion(false);
    }
  };

  if (loading && direcciones.length === 0) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando direcciones...</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  return (
    <TaskScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.direccionesHeader}>
            <Text style={styles.sectionHeading}>Direcciones del cliente</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openDireccionModal()}>
              <Text style={styles.addButtonText}>+ Nueva</Text>
            </TouchableOpacity>
          </View>

          {loadingDirecciones ? (
            <ActivityIndicator size="small" color={HoffColors.primary} style={styles.loadingInline} />
          ) : direcciones.length === 0 ? (
            <Text style={styles.emptyText}>No hay direcciones. Pulsa «Nueva» para añadir la primera.</Text>
          ) : (
            direcciones.map((direccion) => (
              <View key={direccion.id} style={styles.direccionItem}>
                <View style={styles.direccionContent}>
                  <Text style={styles.direccionCompleta}>{direccion.direccion_completa}</Text>
                  <Text style={styles.direccionDetalle}>
                    {direccion.ciudad}
                    {direccion.codigo_postal && `, ${direccion.codigo_postal}`}
                    {direccion.provincia && `, ${direccion.provincia}`}
                  </Text>
                  {direccion.notas ? <Text style={styles.direccionNotas}>{direccion.notas}</Text> : null}
                </View>
                <View style={styles.direccionActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => openDireccionModal(direccion)}>
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteDireccionId(direccion.id)}>
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showDireccionModal} transparent animationType="slide" onRequestClose={closeDireccionModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingDireccion ? 'Editar dirección' : 'Nueva dirección'}</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalLabelFirst}>Vista previa (se guarda así)</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>
                  {previewLine.trim() ? previewLine : '— Indica al menos calle y ciudad —'}
                </Text>
              </View>

              <Text style={styles.modalLabel}>Nombre de la calle *</Text>
              <TextInput
                style={styles.modalInput}
                placeholderTextColor={HoffColors.textMuted}
                placeholder="Ej. Downing Street"
                value={calle}
                onChangeText={setCalle}
              />

              <View style={styles.modalRow}>
                <View style={styles.modalRowItem}>
                  <Text style={styles.modalLabel}>Número o nombre</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholderTextColor={HoffColors.textMuted}
                    placeholder="Ej. 10"
                    value={numero}
                    onChangeText={setNumero}
                  />
                </View>
                <View style={styles.modalRowItem}>
                  <Text style={styles.modalLabel}>Piso / puerta</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholderTextColor={HoffColors.textMuted}
                    placeholder="Ej. Flat 2B"
                    value={piso}
                    onChangeText={setPiso}
                  />
                </View>
              </View>

              <View style={styles.modalRow}>
                <View style={[styles.modalRowItem, { flex: 2 }]}>
                  <Text style={styles.modalLabel}>Ciudad *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholderTextColor={HoffColors.textMuted}
                    placeholder="Ej. London"
                    value={ciudad}
                    onChangeText={setCiudad}
                  />
                </View>
                <View style={styles.modalRowItem}>
                  <Text style={styles.modalLabel}>Código postal</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholderTextColor={HoffColors.textMuted}
                    placeholder="Ej. SW1A 2AA"
                    autoCapitalize="characters"
                    value={codigoPostal}
                    onChangeText={(text) => setCodigoPostal(formatearCodigoPostalUK(text))}
                  />
                </View>
              </View>

              <Text style={styles.modalLabel}>Condado (county)</Text>
              <TextInput
                style={styles.modalInput}
                placeholderTextColor={HoffColors.textMuted}
                placeholder="Ej. Greater London"
                value={provincia}
                onChangeText={setProvincia}
              />

              <Text style={styles.modalLabel}>País</Text>
              <TextInput
                style={styles.modalInput}
                placeholderTextColor={HoffColors.textMuted}
                placeholder="United Kingdom"
                value={pais}
                onChangeText={setPais}
              />

              <Text style={styles.modalLabel}>Notas (opcional)</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholderTextColor={HoffColors.textMuted}
                placeholder="Indicaciones de acceso, portería, etc. (no sustituye la dirección)"
                multiline
                numberOfLines={3}
                value={notasDireccion}
                onChangeText={setNotasDireccion}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeDireccionModal}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, savingDireccion && styles.modalSaveButtonDisabled]}
                onPress={handleSaveDireccion}
                disabled={savingDireccion}
              >
                {savingDireccion ? (
                  <ActivityIndicator color={HoffColors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteDireccionId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteDireccionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Eliminar dirección?</Text>
            <Text style={styles.modalDeleteMessage}>
              Esta acción no se puede deshacer. Si la dirección está en uso en alguna tarea, no se podrá eliminar.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeDeleteDireccionModal}
                disabled={deletingDireccion}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteButton, deletingDireccion && styles.modalSaveButtonDisabled]}
                onPress={confirmDeleteDireccion}
                disabled={deletingDireccion}
              >
                {deletingDireccion ? (
                  <ActivityIndicator color={HoffColors.white} size="small" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        variant={infoModal.variant}
        onPrimary={closeInfoModal}
      />
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: taskSpacing.xxl },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    margin: taskSpacing.lg,
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
    flex: 1,
  },
  direccionesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: taskSpacing.md,
  },
  addButton: {
    backgroundColor: HoffColors.primary,
    paddingHorizontal: taskSpacing.lg,
    paddingVertical: taskSpacing.sm,
    borderRadius: taskRadius.sm,
  },
  addButtonText: {
    color: HoffColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingInline: {
    marginVertical: taskSpacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: HoffColors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  direccionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: taskSpacing.md,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
    marginTop: taskSpacing.md,
  },
  direccionContent: {
    flex: 1,
    marginRight: taskSpacing.md,
  },
  direccionCompleta: {
    fontSize: 15,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: 4,
  },
  direccionDetalle: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    marginBottom: 4,
  },
  direccionNotas: {
    fontSize: 12,
    color: HoffColors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  direccionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: { padding: 8 },
  editButtonText: { fontSize: 18 },
  deleteButton: { padding: 8 },
  deleteButtonText: { fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    width: '90%',
    maxHeight: '90%',
    padding: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: taskSpacing.lg,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalLabelFirst: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: 6,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.text,
    marginTop: taskSpacing.md,
    marginBottom: 6,
  },
  previewBox: {
    borderWidth: 1,
    borderColor: HoffColors.primary,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    backgroundColor: HoffColors.secondaryMuted,
    marginBottom: taskSpacing.sm,
  },
  previewText: {
    fontSize: 15,
    color: HoffColors.text,
    lineHeight: 22,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    color: HoffColors.text,
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    color: HoffColors.text,
    minHeight: 80,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRowItem: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: taskSpacing.md,
    marginTop: taskSpacing.lg,
    paddingTop: taskSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: 14,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: HoffColors.primary,
    padding: 14,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
  modalDeleteMessage: {
    fontSize: 15,
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.sm,
    textAlign: 'center',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#c62828',
    padding: 14,
    borderRadius: taskRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
});
