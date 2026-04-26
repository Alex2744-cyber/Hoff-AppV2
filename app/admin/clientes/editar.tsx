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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { ProfilePhotoFormSection } from '@/components/admin/ProfilePhotoFormSection';

export default function EditarClienteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'empresa' | 'particular'>('particular');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');

  const [administradorNombre, setAdministradorNombre] = useState('');
  const [administradorTelefono, setAdministradorTelefono] = useState('');
  const [administradorEmail, setAdministradorEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadCliente();
    }
  }, [id]);

  const loadCliente = async () => {
    try {
      setLoading(true);
      const response = await api.getClienteById(Number(id));
      if (response.success && response.data) {
        const cliente = response.data;
        setNombre(cliente.tipo === 'particular' ? cliente.nombre || '' : '');
        setTipo(cliente.tipo || 'particular');
        setNombreEmpresa(
          cliente.tipo === 'empresa' ? cliente.nombre_empresa || cliente.nombre || '' : ''
        );
        setDescripcion(cliente.descripcion || '');
        setTelefono(cliente.telefono || '');
        setEmail(cliente.email || '');
        setFotoPerfil(cliente.foto_perfil || '');
        setAdministradorNombre(cliente.administrador_nombre || '');
        setAdministradorTelefono(cliente.administrador_telefono || '');
        setAdministradorEmail(cliente.administrador_email || '');
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el cliente');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (tipo === 'particular' && !nombre.trim()) {
      Alert.alert('Error', 'El nombre completo es obligatorio');
      return;
    }

    if (tipo === 'empresa' && !nombreEmpresa.trim()) {
      Alert.alert('Error', 'El nombre de la empresa es obligatorio');
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
      const clienteData: Record<string, unknown> = {
        tipo,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        descripcion: descripcion.trim() || null,
        foto_perfil: fotoPerfil.trim() || null,
      };

      if (tipo === 'empresa') {
        clienteData.nombre_empresa = nombreEmpresa.trim();
        clienteData.administrador_nombre = administradorNombre.trim() || null;
        clienteData.administrador_telefono = administradorTelefono.trim() || null;
        clienteData.administrador_email = administradorEmail.trim() || null;
      } else {
        clienteData.nombre = nombre.trim();
        clienteData.administrador_nombre = null;
        clienteData.administrador_telefono = null;
        clienteData.administrador_email = null;
        clienteData.nombre_empresa = null;
      }

      const response = await api.updateCliente(Number(id), clienteData);

      if (response.success) {
        await loadCliente();
        Alert.alert('Guardado', 'Los cambios se han guardado correctamente.');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo actualizar el cliente';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TaskScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HoffColors.primary} />
          <Text style={styles.loadingText}>Cargando cliente...</Text>
        </View>
      </TaskScreenContainer>
    );
  }

  return (
    <TaskScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Tipo de cliente</Text>
          <Text style={styles.label}>Selecciona una opción *</Text>
          <View style={styles.tipoContainer}>
            <TouchableOpacity
              style={[styles.tipoButton, tipo === 'particular' && styles.tipoButtonActive]}
              onPress={() => setTipo('particular')}
            >
              <Text style={[styles.tipoButtonText, tipo === 'particular' && styles.tipoButtonTextActive]}>
                Particular
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipoButton, tipo === 'empresa' && styles.tipoButtonActive]}
              onPress={() => setTipo('empresa')}
            >
              <Text style={[styles.tipoButtonText, tipo === 'empresa' && styles.tipoButtonTextActive]}>
                Empresa
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {tipo === 'particular' ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Datos del cliente</Text>
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre y apellidos"
              placeholderTextColor={HoffColors.textMuted}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Datos de la empresa</Text>
            <Text style={styles.label}>Nombre de la empresa *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Tech Solutions Ltd"
              placeholderTextColor={HoffColors.textMuted}
              value={nombreEmpresa}
              onChangeText={setNombreEmpresa}
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Información de contacto</Text>
          <Text style={styles.helperMuted}>
            {tipo === 'empresa'
              ? 'Teléfono y correo generales de la empresa (opcional).'
              : 'Teléfono y correo del cliente (opcional).'}
          </Text>

          <Text style={styles.subLabel}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+44 7xxx xxxxxx"
            placeholderTextColor={HoffColors.textMuted}
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />

          <Text style={styles.subLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={HoffColors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {tipo === 'empresa' && (
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Administrador actual</Text>
            <Text style={styles.helperText}>
              Persona de contacto o responsable. Puedes actualizarlo cuando cambie.
            </Text>

            <Text style={styles.subLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del administrador"
              placeholderTextColor={HoffColors.textMuted}
              value={administradorNombre}
              onChangeText={setAdministradorNombre}
            />

            <Text style={styles.subLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="+44 7xxx xxxxxx"
              placeholderTextColor={HoffColors.textMuted}
              keyboardType="phone-pad"
              value={administradorTelefono}
              onChangeText={setAdministradorTelefono}
            />

            <Text style={styles.subLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@empresa.com"
              placeholderTextColor={HoffColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={administradorEmail}
              onChangeText={setAdministradorEmail}
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Descripción</Text>
          <Text style={styles.label}>Notas adicionales (opcional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Información adicional sobre el cliente..."
            placeholderTextColor={HoffColors.textMuted}
            multiline
            numberOfLines={4}
            value={descripcion}
            onChangeText={setDescripcion}
            textAlignVertical="top"
          />
        </View>

        <ProfilePhotoFormSection
          displayName={tipo === 'empresa' ? nombreEmpresa : nombre}
          fotoUrl={fotoPerfil}
          onFotoUrlChange={setFotoPerfil}
          mediaTipo="cliente_perfil"
        />

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={HoffColors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: taskSpacing.xxl,
  },
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: taskSpacing.sm,
  },
  helperMuted: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    marginBottom: taskSpacing.sm,
    lineHeight: 18,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: HoffColors.textSecondary,
    marginTop: taskSpacing.md,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    marginBottom: taskSpacing.md,
  },
  tipoContainer: {
    flexDirection: 'row',
    gap: taskSpacing.md,
  },
  tipoButton: {
    flex: 1,
    padding: 14,
    borderRadius: taskRadius.sm,
    borderWidth: 2,
    borderColor: HoffColors.border,
    backgroundColor: HoffColors.background,
    alignItems: 'center',
  },
  tipoButtonActive: {
    borderColor: HoffColors.primary,
    backgroundColor: HoffColors.secondaryMuted,
  },
  tipoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  tipoButtonTextActive: {
    color: HoffColors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    color: HoffColors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.sm,
    padding: taskSpacing.md,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    color: HoffColors.text,
    minHeight: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: taskSpacing.md,
    marginTop: taskSpacing.sm,
    marginBottom: taskSpacing.xxl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: taskSpacing.lg,
    borderRadius: taskRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  submitButton: {
    flex: 1,
    backgroundColor: HoffColors.primary,
    padding: taskSpacing.lg,
    borderRadius: taskRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
});
