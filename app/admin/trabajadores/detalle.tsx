import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../services/api';

export default function DetalleTrabajadorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [trabajador, setTrabajador] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activo, setActivo] = useState(true);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [showCredencialesModal, setShowCredencialesModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadTrabajador();
    }
  }, [id]);

  const loadTrabajador = async () => {
    try {
      setLoading(true);
      const response = await api.getTrabajadorById(Number(id));
      if (response.success && response.data) {
        const data = response.data;
        setTrabajador(data);
        setNombre(data.nombre || '');
        setDescripcion(data.descripcion || '');
        setActivo(data.activo !== undefined ? data.activo : true);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar el trabajador');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    setSaving(true);

    try {
      const trabajadorData: any = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        activo: activo,
      };

      const response = await api.updateTrabajador(Number(id), trabajadorData);

      if (response.success) {
        Alert.alert(
          '¡Trabajador actualizado!',
          'Los cambios se han guardado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el trabajador');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando trabajador...</Text>
      </View>
    );
  }

  if (!trabajador) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Trabajador no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Información del perfil */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>👤 Información del Perfil</Text>
        
        <View style={styles.avatarSection}>
          {trabajador.foto_perfil ? (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {trabajador.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={[styles.avatarContainer, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {trabajador.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Usuario</Text>
        <View style={styles.usuarioContainer}>
          <Text style={styles.usuarioText}>@{trabajador.usuario}</Text>
          <Text style={styles.usuarioHelper}>El usuario no puede ser modificado</Text>
        </View>

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Descripción del trabajador (opcional)"
          multiline
          numberOfLines={4}
          value={descripcion}
          onChangeText={setDescripcion}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Fecha de registro</Text>
        <Text style={styles.infoText}>
          {new Date(trabajador.fecha_creacion || Date.now()).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
        <Text style={styles.helperText}>
          Ver estadísticas detalladas del trabajador, incluyendo tareas aprobadas y horas trabajadas por período
        </Text>
        <TouchableOpacity
          style={styles.estadisticasButton}
          onPress={() => router.push(`/admin/trabajadores/estadisticas?id=${id}&nombre=${encodeURIComponent(trabajador.nombre)}`)}
        >
          <Text style={styles.estadisticasButtonText}>📈 Ver Estadísticas Detalladas</Text>
        </TouchableOpacity>
      </View>

      {/* Credenciales de acceso */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔐 Credenciales de Acceso</Text>
        <Text style={styles.helperText}>
          Ver las credenciales de acceso del trabajador
        </Text>
        <TouchableOpacity
          style={styles.credencialesButton}
          onPress={() => setShowCredencialesModal(true)}
        >
          <Text style={styles.credencialesButtonText}>👁️ Ver Credenciales</Text>
        </TouchableOpacity>
      </View>

      {/* Estado del trabajador */}
      <View style={styles.card}>
        <View style={styles.estadoContainer}>
          <Text style={styles.sectionTitle}>Estado del Trabajador</Text>
          <View style={styles.estadoRow}>
            <Text style={styles.estadoLabel}>
              {activo ? '✅ Trabajador Activo' : '❌ Trabajador Desactivado'}
            </Text>
            <TouchableOpacity
              style={[styles.estadoButton, activo ? styles.estadoButtonActive : styles.estadoButtonInactive]}
              onPress={() => {
                if (activo) {
                  // Desactivar
                  Alert.alert(
                    '¿Desactivar trabajador?',
                    'Al desactivar el trabajador, no podrá iniciar sesión ni ser asignado a nuevas tareas. El trabajador no aparecerá en las listas de selección pero podrá ser reactivado más adelante.',
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
              Este trabajador está desactivado y no aparecerá en las listas de selección.
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

      {/* Modal de credenciales */}
      <Modal
        visible={showCredencialesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCredencialesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔐 Credenciales de Acceso</Text>
            
            <View style={styles.credencialesInfo}>
              <Text style={styles.credencialesLabel}>Usuario:</Text>
              <View style={styles.credencialesValueContainer}>
                <Text style={styles.credencialesValue}>@{trabajador.usuario}</Text>
              </View>
              
              <Text style={styles.credencialesLabel}>Contraseña:</Text>
              <View style={styles.credencialesPasswordContainer}>
                <Text style={styles.credencialesPasswordText}>
                  ••••••••••••
                </Text>
                <Text style={styles.credencialesPasswordHelper}>
                  La contraseña está encriptada por seguridad. Para cambiarla, el trabajador debe usar la opción "Cambiar contraseña" en su perfil.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCredencialesModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
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
    paddingBottom: 100,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#9E9E9E',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
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
  usuarioContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  usuarioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  usuarioHelper: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  credencialesButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  credencialesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  estadisticasButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  estadisticasButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '500',
    color: '#333',
  },
  estadoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  estadoButtonActive: {
    backgroundColor: '#FFEBEE',
  },
  estadoButtonInactive: {
    backgroundColor: '#E8F5E9',
  },
  estadoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
  },
  estadoButtonTextInactive: {
    color: '#2E7D32',
  },
  estadoHelperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  credencialesInfo: {
    marginBottom: 20,
  },
  credencialesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 6,
  },
  credencialesValueContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  credencialesValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  credencialesPasswordContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  credencialesPasswordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 4,
    marginBottom: 8,
  },
  credencialesPasswordHelper: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

