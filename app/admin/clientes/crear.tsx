import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../../services/api';

export default function CrearClienteScreen() {
  const router = useRouter();
  
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
  
  const [saving, setSaving] = useState(false);

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
      };

      if (tipo === 'empresa') {
        clienteData.nombre_empresa = nombreEmpresa.trim();
        clienteData.administrador_nombre = administradorNombre.trim() || null;
        clienteData.administrador_telefono = administradorTelefono.trim() || null;
        clienteData.administrador_email = administradorEmail.trim() || null;
      }

      const response = await api.createCliente(clienteData);

      if (response.success) {
        Alert.alert(
          '¡Cliente creado!',
          'El cliente se ha creado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el cliente');
    } finally {
      setSaving(false);
    }
  };

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
            Información del administrador actual de la empresa. Puede cambiarse más adelante.
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
            <Text style={styles.submitButtonText}>Crear Cliente</Text>
          )}
        </TouchableOpacity>
      </View>
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
});

