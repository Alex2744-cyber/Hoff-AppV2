import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../services/api';

export default function EditarClienteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'empresa' | 'particular'>('particular');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  
  // Campos de administrador (solo para empresas)
  const [administradorNombre, setAdministradorNombre] = useState('');
  const [administradorTelefono, setAdministradorTelefono] = useState('');
  const [administradorEmail, setAdministradorEmail] = useState('');
  
  // Estados para direcciones
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [showDireccionModal, setShowDireccionModal] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState<any | null>(null);
  
  // Estados del formulario de dirección
  const [direccionCompleta, setDireccionCompleta] = useState('');
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (id) {
      loadCliente();
      loadDirecciones();
    }
  }, [id]);

  const loadCliente = async () => {
    try {
      setLoading(true);
      const response = await api.getClienteById(Number(id));
      if (response.success && response.data) {
        const cliente = response.data;
        setNombre(cliente.nombre || '');
        setTipo(cliente.tipo || 'particular');
        setNombreEmpresa(cliente.nombre_empresa || '');
        setDescripcion(cliente.descripcion || '');
        setTelefono(cliente.telefono || '');
        setEmail(cliente.email || '');
        setAdministradorNombre(cliente.administrador_nombre || '');
        setAdministradorTelefono(cliente.administrador_telefono || '');
        setAdministradorEmail(cliente.administrador_email || '');
        setActivo(cliente.activo !== undefined ? cliente.activo : true);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar el cliente');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadDirecciones = async () => {
    try {
      setLoadingDirecciones(true);
      const response = await api.getDireccionesByCliente(Number(id));
      if (response.success) {
        setDirecciones(response.data || []);
      }
    } catch (error: any) {
      console.error('Error cargando direcciones:', error);
    } finally {
      setLoadingDirecciones(false);
    }
  };

  // Función para formatear código postal UK (acepta todos los formatos oficiales)
  const formatearCodigoPostalUK = (text: string): string => {
    // Solo letras, números y un espacio; convertir a mayúsculas
    const limpio = text.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase();
    const sinEspacios = limpio.replace(/\s+/g, '');

    // UK postcode: outcode (2-4 chars) + espacio + incode (3 chars) = máx. 7 chars sin espacio, 8 con espacio
    const limitado = sinEspacios.slice(0, 8);

    if (limitado.length <= 3) {
      return limitado;
    }
    // Un solo espacio antes de los últimos 3 caracteres (incode): M1 1AA, SW17 8ED, SW1A 2AA
    return `${limitado.slice(0, -3)} ${limitado.slice(-3)}`;
  };

  const openDireccionModal = (direccion?: any) => {
    if (direccion) {
      setEditingDireccion(direccion);
      setDireccionCompleta(direccion.direccion_completa || '');
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
      setDireccionCompleta('');
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
  };

  const closeDireccionModal = () => {
    setShowDireccionModal(false);
    setEditingDireccion(null);
  };

  const handleSaveDireccion = async () => {
    if (!direccionCompleta.trim() || !calle.trim() || !ciudad.trim()) {
      Alert.alert('Error', 'Complete address, street name and town/city are required');
      return;
    }

    setSavingDireccion(true);

    try {
      const direccionData = {
        cliente_id: Number(id),
        direccion_completa: direccionCompleta.trim(),
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
        Alert.alert(
          '¡Éxito!',
          editingDireccion ? 'Dirección actualizada' : 'Dirección creada',
          [{ text: 'OK', onPress: () => {
            closeDireccionModal();
            loadDirecciones();
          }}]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la dirección');
    } finally {
      setSavingDireccion(false);
    }
  };

  const openDeleteDireccionModal = (direccionId: number) => {
    setDeleteDireccionId(direccionId);
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
        loadDirecciones();
        Alert.alert('Éxito', 'Dirección eliminada');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo eliminar la dirección');
    } finally {
      setDeletingDireccion(false);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (tipo === 'empresa' && !nombreEmpresa.trim()) {
      Alert.alert('Error', 'El nombre de la empresa es requerido');
      return;
    }

    if (email && !email.includes('@')) {
      Alert.alert('Error', 'El email no es válido');
      return;
    }

    if (administradorEmail && !administradorEmail.includes('@')) {
      Alert.alert('Error', 'El email del administrador no es válido');
      return;
    }

    setSaving(true);

    try {
      const clienteData: any = {
        nombre: nombre.trim(),
        tipo,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        descripcion: descripcion.trim() || null,
        activo: activo,
      };

      if (tipo === 'empresa') {
        clienteData.nombre_empresa = nombreEmpresa.trim();
        clienteData.administrador_nombre = administradorNombre.trim() || null;
        clienteData.administrador_telefono = administradorTelefono.trim() || null;
        clienteData.administrador_email = administradorEmail.trim() || null;
      } else {
        // Limpiar campos de administrador si cambia a particular
        clienteData.administrador_nombre = null;
        clienteData.administrador_telefono = null;
        clienteData.administrador_email = null;
      }

      const response = await api.updateCliente(Number(id), clienteData);

      if (response.success) {
        // Si se desactivó el cliente, recargar direcciones (deberían estar vacías)
        if (!activo) {
          loadDirecciones();
        }
        Alert.alert(
          '¡Cliente actualizado!',
          'Los cambios se han guardado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando cliente...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tipo de cliente */}
      <View style={styles.card}>
        <Text style={styles.label}>Tipo de cliente *</Text>
        <View style={styles.tipoContainer}>
          <TouchableOpacity
            style={[styles.tipoButton, tipo === 'particular' && styles.tipoButtonActive]}
            onPress={() => setTipo('particular')}
          >
            <Text style={[styles.tipoButtonText, tipo === 'particular' && styles.tipoButtonTextActive]}>
              👤 Particular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipoButton, tipo === 'empresa' && styles.tipoButtonActive]}
            onPress={() => setTipo('empresa')}
          >
            <Text style={[styles.tipoButtonText, tipo === 'empresa' && styles.tipoButtonTextActive]}>
              🏢 Empresa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nombre */}
      <View style={styles.card}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder={tipo === 'empresa' ? 'Nombre del contacto principal' : 'Nombre completo'}
          value={nombre}
          onChangeText={setNombre}
        />
      </View>

      {/* Nombre de empresa (solo para empresas) */}
      {tipo === 'empresa' && (
        <View style={styles.card}>
          <Text style={styles.label}>Nombre de la empresa *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Tech Solutions S.L."
            value={nombreEmpresa}
            onChangeText={setNombreEmpresa}
          />
        </View>
      )}

      {/* Contacto */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📞 Información de Contacto</Text>
        
        <Text style={styles.subLabel}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="+34 912345678"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />

        <Text style={styles.subLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Administrador (solo para empresas) */}
      {tipo === 'empresa' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👔 Administrador Actual</Text>
          <Text style={styles.helperText}>
            Información del administrador actual de la empresa. Puede cambiarse cuando haya un cambio de administrador.
          </Text>
          
          <Text style={styles.subLabel}>Nombre del administrador</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Carlos Martínez"
            value={administradorNombre}
            onChangeText={setAdministradorNombre}
          />

          <Text style={styles.subLabel}>Teléfono del administrador</Text>
          <TextInput
            style={styles.input}
            placeholder="+34 912345679"
            keyboardType="phone-pad"
            value={administradorTelefono}
            onChangeText={setAdministradorTelefono}
          />

          <Text style={styles.subLabel}>Email del administrador</Text>
          <TextInput
            style={styles.input}
            placeholder="carlos.martinez@empresa.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={administradorEmail}
            onChangeText={setAdministradorEmail}
          />
        </View>
      )}

      {/* Descripción */}
      <View style={styles.card}>
        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Información adicional sobre el cliente..."
          multiline
          numberOfLines={4}
          value={descripcion}
          onChangeText={setDescripcion}
          textAlignVertical="top"
        />
      </View>

      {/* Direcciones */}
      <View style={styles.card}>
        <View style={styles.direccionesHeader}>
          <Text style={styles.sectionTitle}>📍 Direcciones</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openDireccionModal()}
          >
            <Text style={styles.addButtonText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {loadingDirecciones ? (
          <ActivityIndicator size="small" color="#2196F3" style={styles.loadingInline} />
        ) : direcciones.length === 0 ? (
          <Text style={styles.emptyText}>No hay direcciones registradas</Text>
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
                {direccion.notas && (
                  <Text style={styles.direccionNotas}>{direccion.notas}</Text>
                )}
              </View>
              <View style={styles.direccionActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openDireccionModal(direccion)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => openDeleteDireccionModal(direccion.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Estado del cliente */}
      <View style={styles.card}>
        <View style={styles.estadoContainer}>
          <Text style={styles.sectionTitle}>Estado del Cliente</Text>
          <View style={styles.estadoRow}>
            <Text style={styles.estadoLabel}>
              {activo ? '✅ Cliente Activo' : '❌ Cliente Desactivado'}
            </Text>
            <TouchableOpacity
              style={[styles.estadoButton, activo ? styles.estadoButtonActive : styles.estadoButtonInactive]}
              onPress={() => {
                if (activo) {
                  // Desactivar
                  Alert.alert(
                    '¿Desactivar cliente?',
                    'Al desactivar el cliente, todas sus direcciones serán eliminadas. El cliente no aparecerá en las listas de selección pero podrá ser reactivado más adelante.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Desactivar',
                        style: 'destructive',
                        onPress: () => setActivo(false)
                      }
                    ]
                  );
                } else {
                  // Activar
                  setActivo(true);
                }
              }}
            >
              <Text style={[styles.estadoButtonText, !activo && styles.estadoButtonTextInactive]}>
                {activo ? 'Desactivar' : 'Activar'}
              </Text>
            </TouchableOpacity>
          </View>
          {!activo && (
            <Text style={styles.estadoHelperText}>
              Este cliente está desactivado y no aparecerá en las listas de selección.
            </Text>
          )}
        </View>
      </View>

      {/* Botones */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal para agregar/editar dirección */}
      <Modal
        visible={showDireccionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDireccionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDireccion ? 'Editar Dirección' : 'Nueva Dirección'}
            </Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalLabel}>Complete Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 10 Downing Street, London, SW1A 2AA"
                value={direccionCompleta}
                onChangeText={setDireccionCompleta}
              />

              <Text style={styles.modalLabel}>Street Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Downing Street"
                value={calle}
                onChangeText={setCalle}
              />

              <View style={styles.modalRow}>
                <View style={styles.modalRowItem}>
                  <Text style={styles.modalLabel}>House Number/Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., 10 or Rose Cottage"
                    value={numero}
                    onChangeText={setNumero}
                  />
                </View>
                <View style={styles.modalRowItem}>
                  <Text style={styles.modalLabel}>Flat/Apartment</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Flat 2B"
                    value={piso}
                    onChangeText={setPiso}
                  />
                </View>
              </View>

              <View style={styles.modalRow}>
                <View style={[styles.modalRowItem, { flex: 2 }]}>
                  <Text style={styles.modalLabel}>Town/City *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., London"
                    value={ciudad}
                    onChangeText={setCiudad}
                  />
                </View>
                <View style={styles.modalRowItem}>
                  <Text style={styles.modalLabel}>Postcode</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., SW1A 2AA"
                    autoCapitalize="characters"
                    value={codigoPostal}
                    onChangeText={(text) => {
                      const formatted = formatearCodigoPostalUK(text);
                      setCodigoPostal(formatted);
                    }}
                  />
                </View>
              </View>

              <Text style={styles.modalLabel}>County</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Greater London"
                value={provincia}
                onChangeText={setProvincia}
              />

              <Text style={styles.modalLabel}>Country</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="United Kingdom"
                value={pais}
                onChangeText={setPais}
              />

              <Text style={styles.modalLabel}>Notas (opcional)</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="Información adicional sobre la dirección..."
                multiline
                numberOfLines={3}
                value={notasDireccion}
                onChangeText={setNotasDireccion}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeDireccionModal}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, savingDireccion && styles.modalSaveButtonDisabled]}
                onPress={handleSaveDireccion}
                disabled={savingDireccion}
              >
                {savingDireccion ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación eliminar dirección (compatible con web) */}
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
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  tipoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  tipoButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  tipoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tipoButtonTextActive: {
    color: '#2196F3',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  direccionesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingInline: {
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  direccionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
  },
  direccionContent: {
    flex: 1,
    marginRight: 12,
  },
  direccionCompleta: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  direccionDetalle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  direccionNotas: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  direccionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalDeleteMessage: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  estadoContainer: {
    marginTop: 8,
  },
  estadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  estadoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  estadoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  estadoButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#f44336',
  },
  estadoButtonInactive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  estadoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  estadoButtonTextInactive: {
    color: '#fff',
  },
  estadoHelperText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

