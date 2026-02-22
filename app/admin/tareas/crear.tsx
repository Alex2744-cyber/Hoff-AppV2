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
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

// Funciones de conversión entre formato tiempo (HH:MM) y decimal
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

const decimalATiempo = (decimal: number): string => {
  if (!decimal || isNaN(decimal) || decimal < 0) return '0:00';
  
  const horas = Math.floor(decimal);
  const minutos = Math.round((decimal - horas) * 60);
  
  // Asegurar que minutos no excedan 59
  const horasFinal = horas + Math.floor(minutos / 60);
  const minutosFinal = minutos % 60;
  
  return `${horasFinal}:${minutosFinal.toString().padStart(2, '0')}`;
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

interface TrabajadorSeleccionado {
  id: number;
  nombre: string;
  horas?: string;
  horasNum?: number;
  minutosNum?: number;
}

// Componente de selector de tiempo deslizable
interface TimePickerProps {
  horas: number;
  minutos: number;
  onHorasChange: (horas: number) => void;
  onMinutosChange: (minutos: number) => void;
  maxHoras?: number;
  maxMinutos?: number;
  minHoras?: number;
  size?: 'large' | 'small';
}

const TimePicker: React.FC<TimePickerProps> = ({
  horas,
  minutos,
  onHorasChange,
  onMinutosChange,
  maxHoras,
  maxMinutos,
  minHoras = 0,
  size = 'large',
}) => {
  const horasScrollRef = React.useRef<ScrollView>(null);
  const minutosScrollRef = React.useRef<ScrollView>(null);

  const maxTotalMinutos = maxHoras !== undefined && maxMinutos !== undefined
    ? maxHoras * 60 + maxMinutos
    : undefined;

  const isDisabled = (h: number, m: number): boolean => {
    if (maxTotalMinutos === undefined) return false;
    const totalMin = h * 60 + m;
    return totalMin > maxTotalMinutos;
  };

  const horasRange = 25; // 0-24
  const minutosRange = 60; // 0-59

  const itemHeight = size === 'large' ? 50 : 40;
  const wrapperHeight = size === 'large' ? 200 : 120;
  const wrapperWidth = size === 'large' ? 100 : 60;

  // Centrar scroll en el valor seleccionado
  React.useEffect(() => {
    const scrollToHoras = horas * itemHeight;
    horasScrollRef.current?.scrollTo({
      y: scrollToHoras,
      animated: true,
    });
  }, [horas, itemHeight]);

  React.useEffect(() => {
    const scrollToMinutos = minutos * itemHeight;
    minutosScrollRef.current?.scrollTo({
      y: scrollToMinutos,
      animated: true,
    });
  }, [minutos, itemHeight]);

  return (
    <View style={styles.timePickerContainer}>
      <View style={styles.timePickerColumn}>
        <Text style={styles.timePickerLabel}>Horas</Text>
        <View 
          style={[styles.timePickerWrapper, { height: wrapperHeight, width: wrapperWidth }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        >
          <ScrollView
            ref={horasScrollRef}
            style={styles.timePickerScroll}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: wrapperHeight / 2 - itemHeight / 2 }}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {Array.from({ length: horasRange }, (_, i) => i).map((h) => {
              const disabled = isDisabled(h, minutos);
              return (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.timePickerItem,
                    { height: itemHeight },
                    horas === h && styles.timePickerItemSelected,
                    disabled && styles.timePickerItemDisabled
                  ]}
                  onPress={() => !disabled && onHorasChange(h)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      size === 'large' && styles.timePickerItemTextLarge,
                      horas === h && styles.timePickerItemTextSelected,
                      disabled && styles.timePickerItemTextDisabled
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
      
      <View style={styles.timePickerColumn}>
        <Text style={styles.timePickerLabel}>Minutos</Text>
        <View 
          style={[styles.timePickerWrapper, { height: wrapperHeight, width: wrapperWidth }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        >
          <ScrollView
            ref={minutosScrollRef}
            style={styles.timePickerScroll}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: wrapperHeight / 2 - itemHeight / 2 }}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {Array.from({ length: minutosRange }, (_, i) => i).map((m) => {
              const disabled = isDisabled(horas, m);
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.timePickerItem,
                    { height: itemHeight },
                    minutos === m && styles.timePickerItemSelected,
                    disabled && styles.timePickerItemDisabled
                  ]}
                  onPress={() => !disabled && onMinutosChange(m)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      size === 'large' && styles.timePickerItemTextLarge,
                      minutos === m && styles.timePickerItemTextSelected,
                      disabled && styles.timePickerItemTextDisabled
                    ]}
                  >
                    {m.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default function CrearTareaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Estados del formulario
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [direccionId, setDireccionId] = useState<number | null>(null);
  const [fechaRealizacion, setFechaRealizacion] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showDireccionModal, setShowDireccionModal] = useState(false);
  const [descripcionGeneral, setDescripcionGeneral] = useState('');
  const [detallesEspecificos, setDetallesEspecificos] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState<number>(0);
  const [minutosEstimados, setMinutosEstimados] = useState<number>(0);
  const [valorServicio, setValorServicio] = useState<string>('');
  
  // Estados para trabajadores
  const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState<TrabajadorSeleccionado[]>([]);
  const [showTrabajadoresModal, setShowTrabajadoresModal] = useState(false);
  
  // Estados para datos
  const [clientes, setClientes] = useState<any[]>([]);
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para modales de tiempo
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showTrabajadorTimeModal, setShowTrabajadorTimeModal] = useState(false);
  const [trabajadorTimeModalId, setTrabajadorTimeModalId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Cargar direcciones cuando cambia el cliente
    if (clienteId) {
      loadDirecciones(clienteId);
    } else {
      setDirecciones([]);
      setDireccionId(null);
    }
  }, [clienteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientesRes, trabajadoresRes] = await Promise.all([
        api.getClientes(),
        api.getTrabajadores(),
      ]);
      
      if (clientesRes.success) setClientes(clientesRes.data);
      if (trabajadoresRes.success) setTrabajadores(trabajadoresRes.data);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadDirecciones = async (clienteId: number) => {
    try {
      setLoadingDirecciones(true);
      const response = await api.getDireccionesByCliente(clienteId);
      if (response.success) {
        setDirecciones(response.data);
        // Si solo hay una dirección, seleccionarla automáticamente
        if (response.data.length === 1) {
          setDireccionId(response.data[0].id);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las direcciones');
    } finally {
      setLoadingDirecciones(false);
    }
  };

  const toggleTrabajador = (trabajador: any) => {
    const exists = trabajadoresSeleccionados.find(t => t.id === trabajador.id);
    
    if (exists) {
      // Deseleccionar
      setTrabajadoresSeleccionados(prev => prev.filter(t => t.id !== trabajador.id));
    } else {
      // Seleccionar y prellenar horas si hay horas estimadas
      const horasDefault = (horasEstimadas > 0 || minutosEstimados > 0)
        ? `${horasEstimadas}:${minutosEstimados.toString().padStart(2, '0')}`
        : '';
      setTrabajadoresSeleccionados(prev => [...prev, {
        id: trabajador.id,
        nombre: trabajador.nombre,
        horas: horasDefault,
        horasNum: horasEstimadas,
        minutosNum: minutosEstimados
      }]);
    }
  };

  const updateHorasTrabajador = (trabajadorId: number, horas: number, minutos: number) => {
    const tiempo = `${horas}:${minutos.toString().padStart(2, '0')}`;
    setTrabajadoresSeleccionados(prev => prev.map(t => 
      t.id === trabajadorId 
        ? { ...t, horas: tiempo, horasNum: horas, minutosNum: minutos }
        : t
    ));
  };

  const validarHoras = (horas: number, minutos: number): boolean => {
    if (horasEstimadas === 0 && minutosEstimados === 0) return true;
    
    const totalMinutosTrabajador = horas * 60 + minutos;
    const totalMinutosEstimados = horasEstimadas * 60 + minutosEstimados;
    
    return totalMinutosTrabajador <= totalMinutosEstimados;
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!clienteId || !direccionId || !fechaRealizacion || !descripcionGeneral.trim() || !valorServicio) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (isNaN(parseFloat(valorServicio)) || parseFloat(valorServicio) <= 0) {
      Alert.alert('Error', 'El valor del servicio debe ser un número mayor a 0');
      return;
    }

    // Validar horas individuales
    if (horasEstimadas > 0 || minutosEstimados > 0) {
      for (const trabajador of trabajadoresSeleccionados) {
        if (trabajador.horasNum !== undefined && trabajador.minutosNum !== undefined) {
          if (!validarHoras(trabajador.horasNum, trabajador.minutosNum)) {
            const tiempoMax = `${horasEstimadas}:${minutosEstimados.toString().padStart(2, '0')}`;
            Alert.alert(
              'Error',
              `Las horas de ${trabajador.nombre} no pueden superar ${tiempoMax}`
            );
            return;
          }
        }
      }
    }

    setSaving(true);

    try {
      // 1. Crear tarea base
      const tareaData: any = {
        cliente_id: clienteId,
        direccion_id: direccionId,
        fecha_realizacion: fechaRealizacion.toISOString().split('T')[0],
        descripcion_general: descripcionGeneral,
        valor_servicio: parseFloat(valorServicio),
      };

      if (detallesEspecificos.trim()) {
        tareaData.detalles_especificos = detallesEspecificos;
      }

      if (horasEstimadas > 0 || minutosEstimados > 0) {
        const horasDecimal = horasEstimadas + (minutosEstimados / 60);
        tareaData.numero_horas = horasDecimal;
      }

      const response = await api.createTarea(tareaData);

      if (response.success) {
        const tareaId = response.data.id;

        // 2. Asignar trabajadores con horas individuales
        if (trabajadoresSeleccionados.length > 0) {
          for (const trabajador of trabajadoresSeleccionados) {
            let horasAsignadas: number | undefined;
            
            if (trabajador.horasNum !== undefined && trabajador.minutosNum !== undefined) {
              // Usar horas y minutos del trabajador
              horasAsignadas = trabajador.horasNum + (trabajador.minutosNum / 60);
            } else if (horasEstimadas > 0 || minutosEstimados > 0) {
              // Usar horas estimadas por defecto
              horasAsignadas = horasEstimadas + (minutosEstimados / 60);
            }

            if (horasAsignadas !== undefined) {
              await api.asignarTrabajador(
                tareaId,
                trabajador.id,
                horasAsignadas
              );
            }
          }
        }

        Alert.alert(
          '¡Tarea creada!',
          'La tarea se ha creado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la tarea');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      nestedScrollEnabled={true}
    >
      {/* Cliente */}
      <View style={styles.card}>
        <Text style={styles.label}>Cliente *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowClienteModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {clienteId 
              ? clientes.find(c => c.id === clienteId)?.nombre || 'Selecciona un cliente'
              : 'Selecciona un cliente'}
          </Text>
          <Text style={styles.selectButtonArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Dirección */}
      <View style={styles.card}>
        <Text style={styles.label}>Dirección *</Text>
        {!clienteId ? (
          <Text style={styles.helperText}>Primero selecciona un cliente</Text>
        ) : loadingDirecciones ? (
          <ActivityIndicator size="small" color="#2196F3" style={styles.loadingInline} />
        ) : direcciones.length === 0 ? (
          <Text style={styles.helperText}>Este cliente no tiene direcciones registradas</Text>
        ) : (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDireccionModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {direccionId
                ? direcciones.find(d => d.id === direccionId)?.direccion_completa || 'Selecciona una dirección'
                : 'Selecciona una dirección'}
            </Text>
            <Text style={styles.selectButtonArrow}>▼</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Fecha de realización */}
      <View style={styles.card}>
        <Text style={styles.label}>Fecha de realización *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {fechaRealizacion.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalContent}>
              <Text style={styles.dateModalTitle}>Seleccionar Fecha</Text>
              <Calendar
                current={fechaRealizacion.toISOString().split('T')[0]}
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={(day) => {
                  setFechaRealizacion(new Date(day.dateString));
                  setShowDatePicker(false);
                }}
                markedDates={{
                  [fechaRealizacion.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#2196F3',
                    selectedTextColor: '#fff'
                  }
                }}
                theme={{
                  todayTextColor: '#2196F3',
                  arrowColor: '#2196F3',
                  selectedDayBackgroundColor: '#2196F3',
                  selectedDayTextColor: '#fff',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
                enableSwipeMonths={true}
              />
              <TouchableOpacity
                style={styles.dateModalButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.dateModalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* Descripción general */}
      <View style={styles.card}>
        <Text style={styles.label}>Descripción del trabajo *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe el trabajo a realizar..."
          multiline
          numberOfLines={4}
          value={descripcionGeneral}
          onChangeText={setDescripcionGeneral}
          textAlignVertical="top"
        />
      </View>

      {/* Detalles específicos */}
      <View style={styles.card}>
        <Text style={styles.label}>Detalles específicos (opcional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Detalles adicionales, instrucciones especiales..."
          multiline
          numberOfLines={3}
          value={detallesEspecificos}
          onChangeText={setDetallesEspecificos}
          textAlignVertical="top"
        />
      </View>

      {/* Horas estimadas */}
      <View style={styles.card}>
        <Text style={styles.label}>Horas estimadas (opcional)</Text>
        <TouchableOpacity
          style={styles.timeDisplayButton}
          onPress={() => setShowTimePickerModal(true)}
        >
          <Text style={styles.timeDisplayText}>
            {horasEstimadas > 0 || minutosEstimados > 0
              ? `${horasEstimadas}:${minutosEstimados.toString().padStart(2, '0')}`
              : '0:00'}
          </Text>
          <Text style={styles.timeDisplayArrow}>▼</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Si se especifica, se usará como valor por defecto para todos los trabajadores asignados
        </Text>
      </View>

      {/* Valor del servicio */}
      <View style={styles.card}>
        <Text style={styles.label}>Valor del servicio (€) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={valorServicio}
          onChangeText={setValorServicio}
        />
      </View>

      {/* Trabajadores */}
      <View style={styles.card}>
        <Text style={styles.label}>Trabajadores (opcional)</Text>
        <TouchableOpacity
          style={styles.trabajadoresButton}
          onPress={() => setShowTrabajadoresModal(true)}
        >
          <Text style={styles.trabajadoresButtonText}>
            {trabajadoresSeleccionados.length > 0
              ? `${trabajadoresSeleccionados.length} trabajador(es) seleccionado(s)`
              : 'Seleccionar trabajadores'}
          </Text>
        </TouchableOpacity>
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
            <Text style={styles.submitButtonText}>Crear Tarea</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de trabajadores - Pantalla completa */}
      <Modal
        visible={showTrabajadoresModal}
        animationType="slide"
        onRequestClose={() => setShowTrabajadoresModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Trabajadores</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTrabajadoresModal(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={trabajadores}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isSelected = trabajadoresSeleccionados.some(t => t.id === item.id);
              const trabajadorSeleccionado = trabajadoresSeleccionados.find(t => t.id === item.id);
              const horasTrabajador = trabajadorSeleccionado?.horasNum ?? horasEstimadas;
              const minutosTrabajador = trabajadorSeleccionado?.minutosNum ?? minutosEstimados;
              
              return (
                <View style={styles.trabajadorItem}>
                  <TouchableOpacity
                    style={styles.trabajadorCheckbox}
                    onPress={() => toggleTrabajador(item)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.trabajadorNombre}>{item.nombre}</Text>
                  </TouchableOpacity>
                  
                  {isSelected && (
                    <View style={styles.horasPickerContainer}>
                      <Text style={styles.horasLabel}>Horas individuales:</Text>
                      <TouchableOpacity
                        style={styles.timeDisplayButtonSmall}
                        onPress={() => {
                          setTrabajadorTimeModalId(item.id);
                          setShowTrabajadorTimeModal(true);
                        }}
                      >
                        <Text style={styles.timeDisplayTextSmall}>
                          {horasTrabajador > 0 || minutosTrabajador > 0
                            ? `${horasTrabajador}:${minutosTrabajador.toString().padStart(2, '0')}`
                            : horasEstimadas > 0 || minutosEstimados > 0
                            ? `${horasEstimadas}:${minutosEstimados.toString().padStart(2, '0')}`
                            : '0:00'}
                        </Text>
                        <Text style={styles.timeDisplayArrowSmall}>▼</Text>
                      </TouchableOpacity>
                      {(horasEstimadas > 0 || minutosEstimados > 0) && (
                        <Text style={styles.horasMaxText}>
                          Máximo: {horasEstimadas}:{minutosEstimados.toString().padStart(2, '0')}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay trabajadores disponibles</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Modal de selección de cliente */}
      <Modal
        visible={showClienteModal}
        animationType="slide"
        onRequestClose={() => setShowClienteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClienteModal(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={clientes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  clienteId === item.id && styles.modalItemSelected
                ]}
                onPress={() => {
                  setClienteId(item.id);
                  setShowClienteModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {item.nombre} ({item.tipo === 'empresa' ? 'Empresa' : 'Particular'})
                </Text>
                {clienteId === item.id && <Text style={styles.modalItemCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Modal de selección de dirección */}
      <Modal
        visible={showDireccionModal}
        animationType="slide"
        onRequestClose={() => setShowDireccionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Dirección</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDireccionModal(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={direcciones}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  direccionId === item.id && styles.modalItemSelected
                ]}
                onPress={() => {
                  setDireccionId(item.id);
                  setShowDireccionModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {item.direccion_completa}, {item.ciudad}
                </Text>
                {direccionId === item.id && <Text style={styles.modalItemCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Modal de horas estimadas */}
      <Modal
        visible={showTimePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.timeModalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimePickerModal(false)}
        >
          <View 
            style={styles.timeModalContent}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <Text style={styles.timeModalTitle}>Seleccionar Horas Estimadas</Text>
            <TimePicker
              horas={horasEstimadas}
              minutos={minutosEstimados}
              onHorasChange={setHorasEstimadas}
              onMinutosChange={setMinutosEstimados}
              minHoras={0}
              size="large"
            />
            <View style={styles.timeModalActions}>
              <TouchableOpacity
                style={styles.timeModalCancelButton}
                onPress={() => setShowTimePickerModal(false)}
              >
                <Text style={styles.timeModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeModalConfirmButton}
                onPress={() => setShowTimePickerModal(false)}
              >
                <Text style={styles.timeModalConfirmText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de horas individuales de trabajador */}
      <Modal
        visible={showTrabajadorTimeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowTrabajadorTimeModal(false);
          setTrabajadorTimeModalId(null);
        }}
      >
        <TouchableOpacity
          style={styles.timeModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowTrabajadorTimeModal(false);
            setTrabajadorTimeModalId(null);
          }}
        >
          <View 
            style={styles.timeModalContent}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <Text style={styles.timeModalTitle}>
              Horas de {trabajadores.find(t => t.id === trabajadorTimeModalId)?.nombre || 'Trabajador'}
            </Text>
            {trabajadorTimeModalId !== null && (() => {
              const trabajadorSeleccionado = trabajadoresSeleccionados.find(t => t.id === trabajadorTimeModalId);
              const horasTrab = trabajadorSeleccionado?.horasNum ?? horasEstimadas;
              const minutosTrab = trabajadorSeleccionado?.minutosNum ?? minutosEstimados;
              
              return (
                <>
                  <TimePicker
                    horas={horasTrab}
                    minutos={minutosTrab}
                    onHorasChange={(h) => updateHorasTrabajador(trabajadorTimeModalId, h, minutosTrab)}
                    onMinutosChange={(m) => updateHorasTrabajador(trabajadorTimeModalId, horasTrab, m)}
                    maxHoras={horasEstimadas}
                    maxMinutos={minutosEstimados}
                    size="large"
                  />
                  {(horasEstimadas > 0 || minutosEstimados > 0) && (
                    <Text style={styles.timeModalMaxText}>
                      Máximo: {horasEstimadas}:{minutosEstimados.toString().padStart(2, '0')}
                    </Text>
                  )}
                </>
              );
            })()}
            <View style={styles.timeModalActions}>
              <TouchableOpacity
                style={styles.timeModalCancelButton}
                onPress={() => {
                  setShowTrabajadorTimeModal(false);
                  setTrabajadorTimeModalId(null);
                }}
              >
                <Text style={styles.timeModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeModalConfirmButton}
                onPress={() => {
                  setShowTrabajadorTimeModal(false);
                  setTrabajadorTimeModalId(null);
                }}
              >
                <Text style={styles.timeModalConfirmText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
  loadingInline: {
    marginVertical: 12,
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
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#f9f9f9',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectButtonArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
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
  trabajadoresButton: {
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#E3F2FD',
  },
  trabajadoresButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  trabajadorItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trabajadorCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trabajadorNombre: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  horasPickerContainer: {
    marginTop: 12,
    marginLeft: 36,
  },
  horasLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  horasMaxText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timeDisplayButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#f9f9f9',
  },
  timeDisplayText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  timeDisplayArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  timeDisplayButtonSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f9f9f9',
    width: 120,
  },
  timeDisplayTextSmall: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  timeDisplayArrowSmall: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  timeModalMaxText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timeModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  timeModalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  timeModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  timeModalConfirmButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeModalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  timePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  timePickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timePickerItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  timePickerItemDisabled: {
    opacity: 0.3,
  },
  timePickerItemText: {
    fontSize: 16,
    color: '#666',
  },
  timePickerItemTextLarge: {
    fontSize: 18,
  },
  timePickerItemTextSelected: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  timePickerItemTextDisabled: {
    color: '#ccc',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalItemCheck: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '95%',
    maxWidth: 400,
  },
  dateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  dateModalButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
