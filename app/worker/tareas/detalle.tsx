import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { getEstadoColor, getEstadoText, decimalATiempo } from '@/utils/tareas';

export default function TareaDetalleScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [tarea, setTarea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComentariosModal, setShowComentariosModal] = useState(false);
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    loadTareaDetalle();
  }, [id]);

  const loadTareaDetalle = async () => {
    try {
      const response = await api.getTareaById(Number(id));
      if (response.success && response.data) {
        setTarea(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el detalle de la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarTarea = () => {
    // Mostrar modal para agregar comentarios
    setShowComentariosModal(true);
  };

  const confirmarCompletar = async () => {
    setShowComentariosModal(false);
    
    try {
      const response = await api.completarTarea(Number(tarea.id), user!.id, comentarios);
      if (response.success) {
        Alert.alert(
          '¡Excelente!', 
          'Tarea marcada como completada. El administrador la revisará pronto.',
          [{ text: 'OK', onPress: () => {
            setComentarios('');
            loadTareaDetalle();
          }}]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar la tarea');
    }
  };

  const handleLlamarCliente = () => {
    if (tarea?.cliente_telefono) {
      Linking.openURL(`tel:${tarea.cliente_telefono}`);
    }
  };

  const handleAbrirMaps = () => {
    if (tarea?.direccion_completa) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tarea.direccion_completa)}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!tarea) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tarea no encontrada</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Verificar si el trabajador está asignado a esta tarea
  const trabajadorAsignado = tarea.trabajadores?.some((t: any) => t.id === user?.id) || false;
  // Puede completar si está asignada O si está completada pero tiene mensaje_rechazo (fue devuelta)
  const puedeCompletar = (tarea.estado === 'asignada' ||
                          (tarea.estado === 'completada' && tarea.mensaje_rechazo)) &&
                         trabajadorAsignado;
  const enRevision = tarea.estado === 'completada' && !tarea.mensaje_rechazo;
  const aprobada = tarea.estado === 'aprobada';
  const esCancelada = tarea.estado === 'cancelada';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Card de Estado */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusCircle, { backgroundColor: getEstadoColor(tarea.estado) }]} />
          <Text style={styles.statusText}>{getEstadoText(tarea.estado)}</Text>
        </View>
      </View>

      {/* Mensaje de rechazo del admin */}
      {tarea.mensaje_rechazo && (
        <View style={styles.card}>
          <View style={[styles.rechazoBox, { backgroundColor: '#FFF3E0' }]}>
            <Text style={[styles.rechazoTitle, { color: '#F57C00' }]}>
              ⚠️ Mensaje del Administrador
            </Text>
            <Text style={styles.rechazoText}>{tarea.mensaje_rechazo}</Text>
            <Text style={styles.rechazoNote}>
              Por favor, corrige lo indicado y vuelve a marcar la tarea como completada.
            </Text>
          </View>
        </View>
      )}

      {/* Descripción */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📋 Descripción del Trabajo</Text>
        <Text style={styles.description}>{tarea.descripcion_general}</Text>
        {tarea.detalles_especificos && (
          <>
            <Text style={styles.subsectionTitle}>Detalles específicos:</Text>
            <Text style={styles.details}>{tarea.detalles_especificos}</Text>
          </>
        )}
      </View>

      {/* Cliente */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>👤 Cliente</Text>
        <Text style={styles.clientName}>{tarea.cliente_nombre}</Text>
        <Text style={styles.clientType}>
          {tarea.cliente_tipo === 'empresa' ? '🏢 Empresa' : '👤 Particular'}
        </Text>
        {tarea.cliente_email && (
          <Text style={styles.clientEmail}>📧 {tarea.cliente_email}</Text>
        )}
        {tarea.cliente_telefono && (
          <TouchableOpacity style={styles.contactButton} onPress={handleLlamarCliente}>
            <Text style={styles.contactButtonText}>📞 {tarea.cliente_telefono}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Administrador (solo para empresas) */}
      {tarea.cliente_tipo === 'empresa' && tarea.cliente_administrador_nombre && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👔 Administrador de la Empresa</Text>
          <Text style={styles.clientName}>{tarea.cliente_administrador_nombre}</Text>
          {tarea.cliente_administrador_telefono && (
            <TouchableOpacity 
              style={styles.contactButton} 
              onPress={() => {
                if (tarea.cliente_administrador_telefono) {
                  Linking.openURL(`tel:${tarea.cliente_administrador_telefono}`);
                }
              }}
            >
              <Text style={styles.contactButtonText}>📞 {tarea.cliente_administrador_telefono}</Text>
            </TouchableOpacity>
          )}
          {tarea.cliente_administrador_email && (
            <Text style={styles.clientEmail}>📧 {tarea.cliente_administrador_email}</Text>
          )}
        </View>
      )}

      {/* Ubicación */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 Ubicación</Text>
        <Text style={styles.address}>{tarea.direccion_completa}</Text>
        <Text style={styles.city}>{tarea.codigo_postal && `${tarea.codigo_postal}, `}{tarea.ciudad}</Text>
        <TouchableOpacity style={styles.mapsButton} onPress={handleAbrirMaps}>
          <Text style={styles.mapsButtonText}>🗺️ Abrir en Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Fecha y horario */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📅 Fecha y Horario</Text>
        <Text style={styles.date}>
          {new Date(tarea.fecha_realizacion).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Equipo de trabajo */}
      {tarea.trabajadores && tarea.trabajadores.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👥 Equipo de Trabajo</Text>
          {tarea.trabajadores.map((trabajador: any) => (
            <View key={trabajador.id} style={styles.workerItem}>
              <Text style={styles.workerName}>
                {trabajador.id === user?.id ? '👷 Tú' : '👷'} {trabajador.nombre}
              </Text>
            </View>
          ))}
          {/* Tiempo del servicio */}
          {(() => {
            const horasTrabajadores = tarea.trabajadores.map((trabajador: any) => {
              return trabajador.horas_aprobadas || 
                     trabajador.horas_asignadas || 
                     (tarea.numero_horas ? tarea.numero_horas / tarea.trabajadores.length : 0);
            });
            const tiempoServicio = horasTrabajadores.length > 0 ? Math.max(...horasTrabajadores.map((h: any) => parseFloat(h) || 0)) : 0;
            return tiempoServicio > 0 ? (
              <View style={styles.tiempoServicioBox}>
                <Text style={styles.tiempoServicioLabel}>⏱️ Tiempo del servicio:</Text>
                <Text style={styles.tiempoServicioValue}>{decimalATiempo(tiempoServicio)}</Text>
              </View>
            ) : null;
          })()}
        </View>
      )}

      {/* Horas asignadas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⏰ Horas Asignadas</Text>
        {tarea.trabajadores && tarea.trabajadores.map((trabajador: any) => {
          if (trabajador.id === user?.id) {
            const horas = trabajador.horas_aprobadas || trabajador.horas_asignadas || 
                         (tarea.numero_horas / tarea.trabajadores.length);
            return (
              <Text key={trabajador.id} style={styles.hoursTotal}>
                Tus horas: {decimalATiempo(parseFloat(horas))}
              </Text>
            );
          }
          return null;
        })}
        {!puedeCompletar && !enRevision && !aprobada && !esCancelada && (
          <Text style={styles.hoursNote}>
            Puedes editar la asignación de horas desde el panel de administración hasta que la tarea se marque como completada.
          </Text>
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        {puedeCompletar && (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompletarTarea}>
            <Text style={styles.completeButtonText}>
              {tarea.estado === 'completada' && tarea.mensaje_rechazo 
                ? '✅ Completar de Nuevo' 
                : '✅ Marcar como Completada'}
            </Text>
          </TouchableOpacity>
        )}

        {enRevision && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>👀 Esta tarea está en revisión por el administrador</Text>
          </View>
        )}

        {/* Información de aprobación (sin estado de pago) */}
        {aprobada && tarea.registro_aprobacion && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>✅ Tarea Aprobada</Text>
            
            <View style={[styles.infoBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.infoBoxText, { color: '#4CAF50' }]}>
                ✅ Tarea aprobada - Trabajo confirmado
              </Text>
            </View>
            
            {/* Información básica de aprobación */}
            <View style={styles.aprobacionInfo}>
              <View style={styles.aprobacionRow}>
                <Text style={styles.aprobacionLabel}>📅 Aprobada el:</Text>
                <Text style={styles.aprobacionValue}>
                  {new Date(tarea.registro_aprobacion.fecha_aprobacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              
              <View style={styles.aprobacionRow}>
                <Text style={styles.aprobacionLabel}>👤 Aprobada por:</Text>
                <Text style={styles.aprobacionValue}>{tarea.registro_aprobacion.aprobado_por_nombre}</Text>
              </View>
              
              {tarea.registro_aprobacion.notas_aprobacion && (
                <View style={styles.aprobacionRow}>
                  <Text style={styles.aprobacionLabel}>📝 Notas:</Text>
                  <Text style={styles.aprobacionValue}>{tarea.registro_aprobacion.notas_aprobacion}</Text>
                </View>
              )}
            </View>
            
            {/* Horas aprobadas finales del trabajador */}
            {tarea.horas_aprobadas_finales && tarea.horas_aprobadas_finales.length > 0 && (
              <View style={styles.horasFinalesSection}>
                <Text style={styles.subsectionTitle}>👷 Tus Horas Aprobadas</Text>
                {tarea.horas_aprobadas_finales
                  .filter((item: any) => item.trabajador_id === user?.id)
                  .map((item: any) => (
                    <View key={item.trabajador_id} style={styles.horaFinalRow}>
                      <Text style={styles.horaFinalLabel}>Horas aprobadas:</Text>
                      <Text style={styles.horaFinalValor}>
                        {decimalATiempo(parseFloat(item.horas_aprobadas_finales))}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Sección de cancelación */}
        {esCancelada && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>❌ Tarea Cancelada</Text>
            
            <View style={[styles.infoBox, { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.infoBoxText, { color: '#C62828' }]}>
                ❌ Esta tarea ha sido cancelada
              </Text>
            </View>
            
            {/* Información de cancelación */}
            <View style={styles.cancelacionInfo}>
              <View style={styles.cancelacionRow}>
                <Text style={styles.cancelacionLabel}>📅 Cancelada el:</Text>
                <Text style={styles.cancelacionValue}>
                  {tarea.ultima_actualizacion 
                    ? new Date(tarea.ultima_actualizacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Fecha no disponible'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.infoBox, { backgroundColor: '#FFF3E0', marginTop: 12 }]}>
              <Text style={[styles.infoBoxText, { color: '#E65100' }]}>
                ℹ️ Esta tarea ha sido cancelada y no requiere acción de tu parte.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal de comentarios al completar */}
      <Modal
        visible={showComentariosModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComentariosModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Completar Tarea</Text>
            <Text style={styles.modalSubtitle}>
              Agrega comentarios sobre el trabajo realizado (opcional):
            </Text>
            
            <TextInput
              style={styles.comentariosInput}
              placeholder="Ej: Cliente satisfecho, área extra limpiada..."
              multiline
              numberOfLines={4}
              value={comentarios}
              onChangeText={setComentarios}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setShowComentariosModal(false);
                  setComentarios('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={confirmarCompletar}
              >
                <Text style={styles.modalConfirmText}>✅ Completar</Text>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 6,
  },
  details: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 8,
  },
  contactButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  address: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  city: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  mapsButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  hours: {
    fontSize: 14,
    color: '#666',
  },
  workerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  workerName: {
    fontSize: 15,
    color: '#333',
  },
  hoursTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  hoursNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#FFC107',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoBoxText: {
    color: '#9C27B0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  comentariosInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rechazoBox: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
  },
  rechazoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rechazoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  rechazoNote: {
    fontSize: 12,
    color: '#F57C00',
    fontStyle: 'italic',
    marginTop: 4,
  },
  aprobacionInfo: {
    marginTop: 12,
    marginBottom: 12,
  },
  aprobacionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  aprobacionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 120,
  },
  aprobacionValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  cancelacionInfo: {
    marginTop: 12,
    marginBottom: 12,
  },
  cancelacionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  cancelacionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 120,
  },
  cancelacionValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  horasFinalesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  horaFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  horaFinalLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  horaFinalValor: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  tiempoServicioBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  tiempoServicioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  tiempoServicioValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
});
