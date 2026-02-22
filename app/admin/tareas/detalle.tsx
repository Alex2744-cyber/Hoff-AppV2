import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import { getEstadoColor, getEstadoText, decimalATiempo } from '@/utils/tareas';

// Funciones de conversión entre formato tiempo (HH:MM) y decimal (solo admin)
const tiempoADecimal = (tiempo: string): number => {
  if (!tiempo || !tiempo.trim()) return 0;
  
  // Si no tiene formato de tiempo, intentar parsear como decimal (retrocompatibilidad)
  if (!tiempo.includes(':')) {
    const decimal = parseFloat(tiempo);
    return isNaN(decimal) ? 0 : decimal;
  }
  
  const partes = tiempo.split(':');
  if (partes.length !== 2) return 0;
  
  const horas = parseInt(partes[0], 10);
  const minutos = parseInt(partes[1], 10);
  
  if (isNaN(horas) || isNaN(minutos)) return 0;
  
  return horas + (minutos / 60);
};

const validarFormatoTiempo = (tiempo: string): boolean => {
  if (!tiempo || !tiempo.trim()) return true; // Vacío es válido (opcional)
  
  // Permitir formato decimal también (retrocompatibilidad)
  if (!tiempo.includes(':')) {
    const decimal = parseFloat(tiempo);
    return !isNaN(decimal) && decimal >= 0;
  }
  
  // Validar formato HH:MM
  const regex = /^(\d{1,2}):([0-5]?\d)$/;
  if (!regex.test(tiempo)) return false;
  
  const [horas, minutos] = tiempo.split(':').map(Number);
  return horas >= 0 && horas < 1000 && minutos >= 0 && minutos < 60;
};

export default function TareaDetalleScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [tarea, setTarea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notasAprobacion, setNotasAprobacion] = useState('');
  const [horasPorTrabajador, setHorasPorTrabajador] = useState<{[key: number]: number}>({});
  const [horasTiempoPorTrabajador, setHorasTiempoPorTrabajador] = useState<{[key: number]: string}>({});
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [mensajeRechazo, setMensajeRechazo] = useState('');
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState<number | null>(null);
  const [horasAsignar, setHorasAsignar] = useState('0:00');
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [showMarcarPagadoModal, setShowMarcarPagadoModal] = useState(false);
  const [referenciaPago, setReferenciaPago] = useState('');

  useEffect(() => {
    loadTareaDetalle();
  }, [id]);

  const loadTareaDetalle = async () => {
    try {
      const response = await api.getTareaById(Number(id));
      if (response.success && response.data) {
        setTarea(response.data);
        
        // Inicializar horas por trabajador (en decimal y formato tiempo)
        if (response.data.trabajadores) {
          const horasIniciales: {[key: number]: number} = {};
          const horasTiempoIniciales: {[key: number]: string} = {};
          response.data.trabajadores.forEach((trabajador: any) => {
            const horasDecimal = trabajador.horas_aprobadas || 
                                 trabajador.horas_asignadas || 
                                 (response.data.numero_horas / response.data.trabajadores.length);
            horasIniciales[trabajador.id] = horasDecimal;
            horasTiempoIniciales[trabajador.id] = decimalATiempo(horasDecimal);
          });
          setHorasPorTrabajador(horasIniciales);
          setHorasTiempoPorTrabajador(horasTiempoIniciales);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el detalle de la tarea');
    } finally {
      setLoading(false);
    }
  };

  const updateHoras = (trabajadorId: number, tiempo: string) => {
    // Filtrar solo números y ":"
    const filtered = tiempo.replace(/[^0-9:]/g, '');
    
    // Validar formato antes de actualizar
    if (filtered && !validarFormatoTiempo(filtered)) {
      return; // No actualizar si el formato es inválido
    }
    
    // Convertir tiempo a decimal para almacenar
    const horasNum = tiempoADecimal(filtered);
    
    setHorasPorTrabajador({
      ...horasPorTrabajador,
      [trabajadorId]: horasNum
    });
    
    setHorasTiempoPorTrabajador({
      ...horasTiempoPorTrabajador,
      [trabajadorId]: filtered || '0:00'
    });
  };

  const getTiempoServicio = () => {
    const horas = Object.values(horasPorTrabajador);
    return horas.length > 0 ? Math.max(...horas) : 0;
  };

  const handleAprobarTarea = async () => {
    const tiempoServicio = getTiempoServicio();
    
    Alert.alert(
      '¿Aprobar tarea?',
      `Tiempo del servicio: ${tiempoServicio}h\n\n¿Confirmas que el trabajo se realizó correctamente? Esto creará un registro permanente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          style: 'default',
          onPress: async () => {
            try {
              // Preparar horas de trabajadores
              const horasArray = Object.entries(horasPorTrabajador).map(([trabajadorId, horas]) => ({
                trabajador_id: parseInt(trabajadorId),
                horas: horas
              }));

              const response = await api.aprobarTarea(
                Number(tarea.id), 
                user!.id, 
                notasAprobacion || undefined,
                horasArray
              );
              
              if (response.success) {
                Alert.alert(
                  '¡Tarea aprobada!', 
                  `Registro permanente creado.\nTiempo del servicio: ${tiempoServicio}h`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo aprobar la tarea');
            }
          },
        },
      ]
    );
  };

  const handleDevolverTarea = () => {
    setShowDevolverModal(true);
  };

  const confirmarDevolver = async () => {
    if (!mensajeRechazo.trim()) {
      Alert.alert('Error', 'Debes proporcionar un mensaje para devolver la tarea');
      return;
    }

    setShowDevolverModal(false);
    
    try {
      const response = await api.devolverTarea(
        Number(tarea.id),
        user!.id,
        mensajeRechazo
      );
      
      if (response.success) {
        Alert.alert(
          'Tarea devuelta',
          'La tarea ha sido devuelta a los trabajadores con tu mensaje.',
          [{ text: 'OK', onPress: () => {
            setMensajeRechazo('');
            loadTareaDetalle();
          }}]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo devolver la tarea');
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

  const loadTrabajadores = async () => {
    try {
      setLoadingTrabajadores(true);
      const response = await api.getTrabajadores();
      if (response.success && response.data) {
        // Filtrar trabajadores activos y que no estén ya asignados
        const trabajadoresAsignados = tarea.trabajadores?.map((t: any) => t.id) || [];
        const disponibles = response.data.filter(
          (t: any) => t.activo && !trabajadoresAsignados.includes(t.id)
        );
        setTrabajadores(disponibles);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los trabajadores');
    } finally {
      setLoadingTrabajadores(false);
    }
  };

  const handleAbrirAsignarModal = () => {
    loadTrabajadores();
    setShowAsignarModal(true);
    // Pre-calcular horas por defecto
    if (tarea.numero_horas && tarea.trabajadores && tarea.trabajadores.length > 0) {
      const horasPorTrabajador = tarea.numero_horas / (tarea.trabajadores.length + 1);
      setHorasAsignar(decimalATiempo(horasPorTrabajador));
    } else if (tarea.numero_horas) {
      setHorasAsignar(decimalATiempo(tarea.numero_horas));
    }
  };

  const handleAsignarTrabajador = async () => {
    if (!trabajadorSeleccionado) {
      Alert.alert('Error', 'Selecciona un trabajador');
      return;
    }

    const horasDecimal = tiempoADecimal(horasAsignar);
    
    try {
      const response = await api.asignarTrabajador(
        Number(tarea.id),
        trabajadorSeleccionado,
        horasDecimal || undefined
      );
      
      if (response.success) {
        Alert.alert('Éxito', 'Trabajador asignado correctamente', [
          { text: 'OK', onPress: () => {
            setShowAsignarModal(false);
            setTrabajadorSeleccionado(null);
            setHorasAsignar('0:00');
            loadTareaDetalle();
          }}
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo asignar el trabajador');
    }
  };

  const handleDesasignarTrabajador = (trabajadorId: number, trabajadorNombre: string) => {
    Alert.alert(
      '¿Desasignar trabajador?',
      `¿Estás seguro de desasignar a ${trabajadorNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desasignar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.desasignarTrabajador(Number(tarea.id), trabajadorId);
              if (response.success) {
                Alert.alert('Éxito', 'Trabajador desasignado', [
                  { text: 'OK', onPress: () => loadTareaDetalle() }
                ]);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo desasignar el trabajador');
            }
          }
        }
      ]
    );
  };

  const handleCancelarTarea = () => {
    Alert.alert(
      '¿Cancelar tarea?',
      'Esta acción cambiará el estado de la tarea a "cancelada". ¿Estás seguro?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.cancelarTarea(Number(tarea.id));
              if (response.success) {
                Alert.alert('Éxito', 'Tarea cancelada', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo cancelar la tarea');
            }
          }
        }
      ]
    );
  };

  const handleEditarTarea = () => {
    Alert.alert(
      'Editar Tarea',
      'La funcionalidad de edición de tareas estará disponible próximamente. Por ahora puedes cancelar esta tarea y crear una nueva con los datos actualizados.',
      [{ text: 'OK' }]
    );
  };

  const handleMarcarComoPagado = () => {
    setShowMarcarPagadoModal(true);
  };

  const confirmarMarcarPagado = async () => {
    if (!tarea?.registro_aprobacion) return;
    
    setShowMarcarPagadoModal(false);
    
    try {
      const response = await api.marcarTareaComoPagada(
        Number(tarea.id),
        referenciaPago.trim() || undefined
      );
      
      if (response.success) {
        Alert.alert('Éxito', 'Tarea marcada como pagada', [
          { text: 'OK', onPress: () => {
            setReferenciaPago('');
            loadTareaDetalle();
          }}
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo marcar como pagado');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
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

  const puedeAprobar = tarea.estado === 'completada';
  const aprobada = tarea.estado === 'aprobada';
  const esPendiente = tarea.estado === 'pendiente';
  const esAsignada = tarea.estado === 'asignada';
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

      {/* Descripción */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📋 Descripción del Servicio</Text>
        <Text style={styles.description}>{tarea.descripcion_general}</Text>
        {tarea.detalles_especificos && (
          <>
            <Text style={styles.subsectionTitle}>Detalles específicos:</Text>
            <Text style={styles.details}>{tarea.detalles_especificos}</Text>
          </>
        )}
      </View>

      {/* Información Financiera */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💰 Información Financiera</Text>
        <View style={styles.financeRow}>
          <Text style={styles.financeLabel}>Valor del servicio:</Text>
          <Text style={styles.financeValue}>€{parseFloat(tarea.valor_servicio).toFixed(2)}</Text>
        </View>
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
        <Text style={styles.sectionTitle}>📅 Programación</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Fecha de realización:</Text>
          <Text style={styles.date}>
            {new Date(tarea.fecha_realizacion).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Creada el:</Text>
          <Text style={styles.dateSmall}>
            {new Date(tarea.fecha_creacion).toLocaleDateString('es-ES')}
          </Text>
        </View>
      </View>

      {/* Equipo de trabajo */}
      {tarea.trabajadores && tarea.trabajadores.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👥 Trabajadores Asignados</Text>
          {tarea.trabajadores.map((trabajador: any) => (
            <View key={trabajador.id} style={styles.workerItem}>
              <Text style={styles.workerName}>👷 {trabajador.nombre}</Text>
              <Text style={styles.workerHours}>
                {trabajador.horas_asignadas ? `${decimalATiempo(parseFloat(trabajador.horas_asignadas))} asignadas` : 
                `${decimalATiempo(tarea.numero_horas / tarea.trabajadores.length)} por defecto`}
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

      {/* Comentarios del trabajador */}
      {tarea.comentarios_trabajador && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💬 Comentarios del Trabajador</Text>
          <View style={styles.comentariosBox}>
            <Text style={styles.comentariosText}>{tarea.comentarios_trabajador}</Text>
          </View>
        </View>
      )}

      {/* Mensaje de rechazo si existe */}
      {tarea.mensaje_rechazo && (
        <View style={styles.card}>
          <View style={[styles.rechazoBox, { backgroundColor: HoffColors.background }]}>
            <Text style={[styles.rechazoTitle, { color: HoffColors.accentDark }]}>
              ⚠️ Mensaje del Administrador
            </Text>
            <Text style={styles.rechazoText}>{tarea.mensaje_rechazo}</Text>
          </View>
        </View>
      )}

      {/* Aprobar tarea (solo si está completada) */}
      {puedeAprobar && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>✅ Aprobar Trabajo</Text>
          
          {/* Ajustar horas individuales */}
          <Text style={styles.subsectionTitle}>Ajustar horas por trabajador:</Text>
          <Text style={styles.hoursHelp}>
            Modifica las horas solo si es necesario. Por defecto se usan las horas asignadas.
          </Text>
          
          {tarea.trabajadores && tarea.trabajadores.map((trabajador: any) => (
            <View key={trabajador.id} style={styles.hoursAdjustRow}>
              <Text style={styles.trabajadorNombre}>{trabajador.nombre}</Text>
              <View style={styles.hoursInputContainer}>
                <TextInput
                  style={styles.hoursInput}
                  value={horasTiempoPorTrabajador[trabajador.id] || '0:00'}
                  onChangeText={(value) => updateHoras(trabajador.id, value)}
                  keyboardType="default"
                  placeholder="0:00"
                />
                <Text style={styles.hoursLabel}>h (formato: 3:30)</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.servicioTiempoBox}>
            <Text style={styles.servicioTiempoLabel}>⏱️ Tiempo del servicio:</Text>
            <Text style={styles.servicioTiempoValue}>{decimalATiempo(getTiempoServicio())}</Text>
          </View>
          <Text style={styles.servicioTiempoNote}>
            (Tiempo = máximo de horas individuales)
          </Text>
          
          {/* Notas del admin */}
          <Text style={styles.approvalLabel}>Notas de aprobación (opcional):</Text>
          <TextInput
            style={styles.notasInput}
            placeholder="Ej: Trabajo excelente, se agregó 1h extra a Juan"
            value={notasAprobacion}
            onChangeText={setNotasAprobacion}
            multiline
            numberOfLines={3}
          />
          
          <TouchableOpacity style={styles.approveButton} onPress={handleAprobarTarea}>
            <Text style={styles.approveButtonText}>✅ Aprobar y Crear Registro Permanente</Text>
          </TouchableOpacity>
          <Text style={styles.approvalWarning}>
            ⚠️ Al aprobar se creará un registro inmutable para nóminas y contabilidad
          </Text>

          {/* Botón para devolver tarea */}
          <TouchableOpacity 
            style={styles.devolverButton} 
            onPress={handleDevolverTarea}
          >
            <Text style={styles.devolverButtonText}>↩️ Devolver Tarea</Text>
          </TouchableOpacity>
          <Text style={styles.devolverHelp}>
            Usa este botón si falta información o necesitas que corrijan algo
          </Text>
        </View>
      )}

      {/* Modal para devolver tarea */}
      <Modal
        visible={showDevolverModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDevolverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Devolver Tarea</Text>
            <Text style={styles.modalSubtitle}>
              Escribe un mensaje explicando qué falta o qué necesita corregirse:
            </Text>
            
            <TextInput
              style={styles.mensajeInput}
              placeholder="Ej: Falta subir imagen del baño, necesito ver foto del trabajo finalizado..."
              multiline
              numberOfLines={4}
              value={mensajeRechazo}
              onChangeText={setMensajeRechazo}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setShowDevolverModal(false);
                  setMensajeRechazo('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={confirmarDevolver}
              >
                <Text style={styles.modalConfirmText}>↩️ Devolver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para marcar como pagado */}
      <Modal
        visible={showMarcarPagadoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowMarcarPagadoModal(false);
          setReferenciaPago('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Marcar como Pagado</Text>
            <Text style={styles.modalSubtitle}>
              Opcional: Agrega una referencia de pago (número de transacción, cheque, etc.)
            </Text>
            
            <TextInput
              style={styles.mensajeInput}
              placeholder="Ej: Transferencia #12345, Cheque #789..."
              value={referenciaPago}
              onChangeText={setReferenciaPago}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowMarcarPagadoModal(false);
                  setReferenciaPago('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={confirmarMarcarPagado}
              >
                <Text style={styles.modalConfirmText}>💰 Marcar como Pagado</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Información del registro permanente si está aprobada */}
      {aprobada && tarea.registro_aprobacion && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>✅ Registro Permanente de Aprobación</Text>
          
          <View style={[styles.infoBox, { backgroundColor: HoffColors.secondaryMuted }]}>
            <Text style={[styles.infoBoxText, { color: HoffColors.primary }]}>
              ✅ Tarea aprobada - Registro permanente creado
            </Text>
          </View>
          
          {/* Información de aprobación */}
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
          
          {/* Estado de pago */}
          <View style={styles.pagoSection}>
            <Text style={styles.subsectionTitle}>💰 Estado de Pago</Text>
            <View style={[
              styles.pagoBox,
              tarea.registro_aprobacion.estado_pago === 'pagado'
                ? { backgroundColor: HoffColors.secondaryMuted, borderLeftColor: HoffColors.primary }
                : { backgroundColor: HoffColors.background, borderLeftColor: HoffColors.accent }
            ]}>
              <Text style={[
                styles.pagoEstado,
                tarea.registro_aprobacion.estado_pago === 'pagado' && styles.pagoEstadoPagado
              ]}>
                {tarea.registro_aprobacion.estado_pago === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
              </Text>
              
              {tarea.registro_aprobacion.estado_pago === 'pagado' && (
                <>
                  {tarea.registro_aprobacion.fecha_pago && (
                    <Text style={styles.pagoFecha}>
                      Fecha de pago: {new Date(tarea.registro_aprobacion.fecha_pago).toLocaleDateString('es-ES')}
                    </Text>
                  )}
                  {tarea.registro_aprobacion.referencia_pago && (
                    <Text style={styles.pagoReferencia}>
                      Referencia: {tarea.registro_aprobacion.referencia_pago}
                    </Text>
                  )}
                </>
              )}
            </View>
            
            {/* Botón para marcar como pagado (solo si está pendiente) */}
            {tarea.registro_aprobacion.estado_pago === 'pendiente' && (
              <TouchableOpacity 
                style={styles.marcarPagadoButton}
                onPress={handleMarcarComoPagado}
              >
                <Text style={styles.marcarPagadoButtonText}>💰 Marcar como Pagado</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Información de nómina */}
          <View style={styles.nominaSection}>
            <Text style={styles.subsectionTitle}>📊 Información de Nómina</Text>
            <View style={styles.nominaRow}>
              <Text style={styles.nominaLabel}>📅 Período:</Text>
              <Text style={styles.nominaValue}>
                {tarea.registro_aprobacion.mes_nomina}/{tarea.registro_aprobacion.anio_nomina}
              </Text>
            </View>
            <View style={styles.nominaRow}>
              <Text style={styles.nominaLabel}>⏱️ Total horas:</Text>
              <Text style={styles.nominaValue}>
                {decimalATiempo(parseFloat(tarea.registro_aprobacion.total_horas_trabajadas))}
              </Text>
            </View>
            <View style={styles.nominaRow}>
              <Text style={styles.nominaLabel}>👥 Trabajadores:</Text>
              <Text style={styles.nominaValue}>{tarea.registro_aprobacion.numero_trabajadores}</Text>
            </View>
          </View>
          
          {/* Horas aprobadas finales por trabajador */}
          {tarea.horas_aprobadas_finales && tarea.horas_aprobadas_finales.length > 0 && (
            <View style={styles.horasFinalesSection}>
              <Text style={styles.subsectionTitle}>👷 Horas Aprobadas Finales</Text>
              {tarea.horas_aprobadas_finales.map((item: any) => (
                <View key={item.trabajador_id} style={styles.horaFinalRow}>
                  <Text style={styles.horaFinalNombre}>{item.trabajador_nombre}:</Text>
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
          
          <View style={[styles.infoBox, { backgroundColor: HoffColors.background }]}>
            <Text style={[styles.infoBoxText, { color: HoffColors.accentDark }]}>
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
            
            {tarea.notas_internas && (
              <View style={styles.cancelacionRow}>
                <Text style={styles.cancelacionLabel}>📝 Notas:</Text>
                <Text style={styles.cancelacionValue}>{tarea.notas_internas}</Text>
              </View>
            )}
          </View>
          
          <View style={[styles.infoBox, { backgroundColor: HoffColors.background, marginTop: 12 }]}>
            <Text style={[styles.infoBoxText, { color: HoffColors.accentDark }]}>
              ℹ️ Una tarea cancelada no puede ser modificada ni reactivada. Si necesitas realizar este trabajo, crea una nueva tarea.
            </Text>
          </View>
        </View>
      )}

      {/* Notas internas (solo si no está cancelada) */}
      {tarea.notas_internas && !esCancelada && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Notas Internas</Text>
          <Text style={styles.notes}>{tarea.notas_internas}</Text>
        </View>
      )}

      {/* Acciones para estado pendiente */}
      {esPendiente && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚙️ Acciones</Text>
          
          {/* Asignar trabajadores */}
          <TouchableOpacity style={styles.actionButton} onPress={handleAbrirAsignarModal}>
            <Text style={styles.actionButtonText}>➕ Asignar Trabajador</Text>
          </TouchableOpacity>

          {/* Desasignar trabajadores (si hay asignados) */}
          {tarea.trabajadores && tarea.trabajadores.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Trabajadores asignados:</Text>
              {tarea.trabajadores.map((trabajador: any) => (
                <View key={trabajador.id} style={styles.trabajadorAsignadoRow}>
                  <Text style={styles.trabajadorAsignadoNombre}>
                    👷 {trabajador.nombre}
                    {trabajador.horas_asignadas && (
                      <Text style={styles.trabajadorHoras}>
                        {' '}({decimalATiempo(parseFloat(trabajador.horas_asignadas))})
                      </Text>
                    )}
                  </Text>
                  <TouchableOpacity
                    style={styles.desasignarButton}
                    onPress={() => handleDesasignarTrabajador(trabajador.id, trabajador.nombre)}
                  >
                    <Text style={styles.desasignarButtonText}>✖️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Editar tarea */}
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEditarTarea}>
            <Text style={styles.actionButtonText}>✏️ Editar Tarea</Text>
          </TouchableOpacity>

          {/* Cancelar tarea */}
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelarTarea}>
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>❌ Cancelar Tarea</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Acciones para estado asignada */}
      {esAsignada && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚙️ Acciones</Text>
          
          {/* Asignar trabajadores adicionales */}
          <TouchableOpacity style={styles.actionButton} onPress={handleAbrirAsignarModal}>
            <Text style={styles.actionButtonText}>➕ Asignar Trabajador</Text>
          </TouchableOpacity>

          {/* Desasignar trabajadores */}
          {tarea.trabajadores && tarea.trabajadores.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Trabajadores asignados:</Text>
              {tarea.trabajadores.map((trabajador: any) => (
                <View key={trabajador.id} style={styles.trabajadorAsignadoRow}>
                  <Text style={styles.trabajadorAsignadoNombre}>
                    👷 {trabajador.nombre}
                    {trabajador.horas_asignadas && (
                      <Text style={styles.trabajadorHoras}>
                        {' '}({decimalATiempo(parseFloat(trabajador.horas_asignadas))})
                      </Text>
                    )}
                  </Text>
                  <TouchableOpacity
                    style={styles.desasignarButton}
                    onPress={() => handleDesasignarTrabajador(trabajador.id, trabajador.nombre)}
                  >
                    <Text style={styles.desasignarButtonText}>✖️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Editar tarea */}
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEditarTarea}>
            <Text style={styles.actionButtonText}>✏️ Editar Tarea</Text>
          </TouchableOpacity>

          {/* Cancelar tarea */}
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelarTarea}>
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>❌ Cancelar Tarea</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal para asignar trabajador */}
      <Modal
        visible={showAsignarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAsignarModal(false);
          setTrabajadorSeleccionado(null);
          setHorasAsignar('0:00');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asignar Trabajador</Text>
            
            {loadingTrabajadores ? (
              <ActivityIndicator size="large" color={HoffColors.primary} style={{ marginVertical: 20 }} />
            ) : trabajadores.length === 0 ? (
              <Text style={styles.modalSubtitle}>
                No hay trabajadores disponibles para asignar
              </Text>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>Selecciona un trabajador:</Text>
                <ScrollView style={styles.trabajadoresList}>
                  {trabajadores.map((trabajador: any) => (
                    <TouchableOpacity
                      key={trabajador.id}
                      style={[
                        styles.trabajadorOption,
                        trabajadorSeleccionado === trabajador.id && styles.trabajadorOptionSelected
                      ]}
                      onPress={() => setTrabajadorSeleccionado(trabajador.id)}
                    >
                      <Text style={styles.trabajadorOptionText}>{trabajador.nombre}</Text>
                      {trabajadorSeleccionado === trabajador.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Horas asignadas (opcional):</Text>
                <TextInput
                  style={styles.hoursInput}
                  value={horasAsignar}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9:]/g, '');
                    if (validarFormatoTiempo(filtered) || filtered === '') {
                      setHorasAsignar(filtered || '0:00');
                    }
                  }}
                  placeholder="0:00"
                  keyboardType="default"
                />
                <Text style={styles.helpText}>
                  Si no especificas horas, se dividirán las horas estimadas entre los trabajadores
                </Text>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setShowAsignarModal(false);
                  setTrabajadorSeleccionado(null);
                  setHorasAsignar('0:00');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              {!loadingTrabajadores && trabajadores.length > 0 && (
                <TouchableOpacity 
                  style={[styles.modalConfirmButton, !trabajadorSeleccionado && styles.modalConfirmButtonDisabled]} 
                  onPress={handleAsignarTrabajador}
                  disabled={!trabajadorSeleccionado}
                >
                  <Text style={styles.modalConfirmText}>Asignar</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: HoffColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HoffColors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: HoffColors.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: HoffColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: HoffColors.primaryDark,
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
    color: HoffColors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: HoffColors.text,
    lineHeight: 22,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  details: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    lineHeight: 20,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  financeLabel: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  financeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.primary,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 4,
  },
  clientTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientTypeIcon: {
    marginRight: 6,
  },
  clientType: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  clientEmail: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginTop: 8,
  },
  contactButton: {
    backgroundColor: HoffColors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  contactButtonText: {
    color: HoffColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  address: {
    fontSize: 15,
    color: HoffColors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  city: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginBottom: 12,
  },
  mapsButton: {
    backgroundColor: HoffColors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapsButtonText: {
    color: HoffColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dateRow: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: HoffColors.text,
    textTransform: 'capitalize',
  },
  dateSmall: {
    fontSize: 14,
    color: HoffColors.textSecondary,
  },
  workerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
    color: HoffColors.text,
  },
  workerHours: {
    fontSize: 13,
    color: HoffColors.primary,
    marginTop: 4,
  },
  comentariosBox: {
    backgroundColor: HoffColors.secondaryMuted,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: HoffColors.accent,
  },
  comentariosText: {
    fontSize: 14,
    color: HoffColors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  hoursHelp: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  hoursAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  trabajadorNombre: {
    fontSize: 15,
    color: HoffColors.text,
    fontWeight: '500',
  },
  hoursInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hoursInput: {
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  hoursLabel: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    fontWeight: '600',
  },
  servicioTiempoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: HoffColors.secondaryMuted,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  servicioTiempoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.primary,
  },
  servicioTiempoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.primary,
  },
  servicioTiempoNote: {
    fontSize: 11,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  approvalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginBottom: 8,
  },
  notasInput: {
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  approveButton: {
    backgroundColor: HoffColors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  approveButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  approvalWarning: {
    fontSize: 12,
    color: HoffColors.accent,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: HoffColors.secondaryMuted,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBoxText: {
    color: HoffColors.accent,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  approvedDate: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  notes: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  rechazoBox: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: HoffColors.accentDark,
  },
  rechazoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rechazoText: {
    fontSize: 14,
    color: HoffColors.text,
    lineHeight: 20,
  },
  devolverButton: {
    backgroundColor: HoffColors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  devolverButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  devolverHelp: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: HoffColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  mensajeInput: {
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: HoffColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: HoffColors.accent,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tiempoServicioBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: HoffColors.secondaryMuted,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  tiempoServicioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.primary,
  },
  tiempoServicioValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HoffColors.primary,
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
    color: HoffColors.textSecondary,
    minWidth: 120,
  },
  aprobacionValue: {
    fontSize: 14,
    color: HoffColors.text,
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
    color: HoffColors.textSecondary,
    minWidth: 120,
  },
  cancelacionValue: {
    fontSize: 14,
    color: HoffColors.text,
    flex: 1,
  },
  pagoSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  pagoBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginTop: 8,
    marginBottom: 12,
  },
  pagoEstado: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.accent,
    marginBottom: 8,
  },
  pagoEstadoPagado: {
    color: HoffColors.primary,
  },
  pagoFecha: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    marginTop: 4,
  },
  pagoReferencia: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  marcarPagadoButton: {
    backgroundColor: HoffColors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  marcarPagadoButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nominaSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  nominaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  nominaLabel: {
    fontSize: 14,
    color: HoffColors.textSecondary,
    fontWeight: '500',
  },
  nominaValue: {
    fontSize: 14,
    color: HoffColors.text,
    fontWeight: '600',
  },
  horasFinalesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: HoffColors.border,
  },
  horaFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  horaFinalNombre: {
    fontSize: 14,
    color: HoffColors.text,
    fontWeight: '500',
  },
  horaFinalValor: {
    fontSize: 14,
    color: HoffColors.primary,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: HoffColors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: HoffColors.accent,
  },
  cancelButton: {
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.accentDark,
  },
  actionButtonText: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: HoffColors.accentDark,
  },
  trabajadorAsignadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  trabajadorAsignadoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: HoffColors.text,
    flex: 1,
  },
  trabajadorHoras: {
    fontSize: 13,
    color: HoffColors.primary,
    fontWeight: 'normal',
  },
  desasignarButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: HoffColors.background,
  },
  desasignarButtonText: {
    fontSize: 16,
    color: HoffColors.accentDark,
  },
  trabajadoresList: {
    maxHeight: 200,
    marginVertical: 12,
  },
  trabajadorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: HoffColors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trabajadorOptionSelected: {
    borderColor: HoffColors.primary,
    backgroundColor: HoffColors.secondaryMuted,
  },
  trabajadorOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: HoffColors.text,
  },
  checkmark: {
    fontSize: 18,
    color: HoffColors.primary,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 12,
  },
});

