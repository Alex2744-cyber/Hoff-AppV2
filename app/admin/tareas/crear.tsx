import React, { useState, useEffect, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import api from '../../../services/api';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer, TaskSearchField } from '@/components/tareas';
import { ClienteAvatar } from '@/components/clientes/ClienteAvatar';

function matchesQuery(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return (text || '').toLowerCase().includes(query.trim().toLowerCase());
}

interface TrabajadorSeleccionado {
  id: number;
  nombre: string;
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

  const slotTop = wrapperHeight / 2 - itemHeight / 2;

  return (
    <View style={styles.timePickerContainer}>
      <View style={styles.timePickerColumn}>
        <Text style={styles.timePickerLabel}>Horas</Text>
        <View
          style={[styles.timePickerWrapper, { height: wrapperHeight, width: wrapperWidth }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        >
          <View
            pointerEvents="none"
            style={[styles.timePickerSlotHighlight, { top: slotTop, height: itemHeight }]}
          />
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
          <View
            pointerEvents="none"
            style={[styles.timePickerSlotHighlight, { top: slotTop, height: itemHeight }]}
          />
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

  const [clienteSearch, setClienteSearch] = useState('');
  const [direccionSearch, setDireccionSearch] = useState('');
  const [trabajadorSearch, setTrabajadorSearch] = useState('');

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
  
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const nombre = c.nombre ?? '';
      const tipoLabel = c.tipo === 'empresa' ? 'empresa' : 'particular';
      return matchesQuery(nombre, clienteSearch) || matchesQuery(tipoLabel, clienteSearch);
    });
  }, [clientes, clienteSearch]);

  const direccionesFiltradas = useMemo(() => {
    return direcciones.filter((d) => {
      const line = `${d.direccion_completa ?? ''} ${d.ciudad ?? ''}`;
      return matchesQuery(line, direccionSearch);
    });
  }, [direcciones, direccionSearch]);

  const trabajadoresFiltrados = useMemo(() => {
    return trabajadores.filter((t) => matchesQuery(t.nombre ?? '', trabajadorSearch));
  }, [trabajadores, trabajadorSearch]);

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

  useEffect(() => {
    if (!showClienteModal) setClienteSearch('');
  }, [showClienteModal]);

  useEffect(() => {
    if (!showDireccionModal) setDireccionSearch('');
  }, [showDireccionModal]);

  useEffect(() => {
    if (!showTrabajadoresModal) setTrabajadorSearch('');
  }, [showTrabajadoresModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientesRes, trabajadoresRes] = await Promise.all([
        api.getClientes(),
        api.getTrabajadores(),
      ]);
      
      if (clientesRes.success) setClientes(clientesRes.data ?? []);
      if (trabajadoresRes.success) setTrabajadores(trabajadoresRes.data ?? []);
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
      if (response.success && response.data) {
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
      setTrabajadoresSeleccionados(prev => prev.filter(t => t.id !== trabajador.id));
    } else {
      setTrabajadoresSeleccionados(prev => [...prev, { id: trabajador.id, nombre: trabajador.nombre }]);
    }
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

        // 2. Asignar trabajadores: el backend usa numero_horas de la tarea como horas_asignadas por trabajador
        if (trabajadoresSeleccionados.length > 0) {
          for (const trabajador of trabajadoresSeleccionados) {
            await api.asignarTrabajador(tareaId, trabajador.id);
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
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <TaskScreenContainer bottomInsetExtra={40}>
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={styles.content}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
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
          <Ionicons name="chevron-down" size={20} color={HoffColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Dirección */}
      <View style={styles.card}>
        <Text style={styles.label}>Dirección *</Text>
        {!clienteId ? (
          <Text style={styles.helperText}>Primero selecciona un cliente</Text>
        ) : loadingDirecciones ? (
          <ActivityIndicator size="small" color={HoffColors.primary} style={styles.loadingInline} />
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
            <Ionicons name="chevron-down" size={20} color={HoffColors.textSecondary} />
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
                    selectedColor: HoffColors.primary,
                    selectedTextColor: '#fff'
                  }
                }}
                theme={{
                  todayTextColor: HoffColors.primary,
                  arrowColor: HoffColors.primary,
                  selectedDayBackgroundColor: HoffColors.primary,
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
          <Ionicons name="chevron-down" size={20} color={HoffColors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Duración total del servicio. Cada trabajador que asignes recibirá esta misma duración en sus horas asignadas (puedes ajustarlas después en el detalle de la tarea).
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
          <Ionicons name="people-outline" size={22} color={HoffColors.primary} style={styles.trabajadoresButtonIcon} />
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
            <ActivityIndicator color={HoffColors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Crear Tarea</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de trabajadores */}
      <Modal
        visible={showTrabajadoresModal}
        animationType="slide"
        onRequestClose={() => setShowTrabajadoresModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar trabajadores</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTrabajadoresModal(false)}
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={28} color={HoffColors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearchWrap}>
            <TaskSearchField
              placeholder="Buscar por nombre..."
              value={trabajadorSearch}
              onChangeText={setTrabajadorSearch}
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={trabajadoresFiltrados}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalListContent}
            renderItem={({ item }) => {
              const isSelected = trabajadoresSeleccionados.some(t => t.id === item.id);
              return (
                <TouchableOpacity
                  style={[styles.trabajadorRow, isSelected && styles.trabajadorRowSelected]}
                  onPress={() => toggleTrabajador(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.trabajadorRowLeft}>
                    <View style={styles.trabajadorIconCircle}>
                      <Ionicons name="person-outline" size={20} color={HoffColors.primary} />
                    </View>
                    <Text style={styles.trabajadorNombre}>{item.nombre}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={isSelected ? HoffColors.primary : HoffColors.border}
                  />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {trabajadores.length === 0
                    ? 'No hay trabajadores disponibles'
                    : 'Ningún resultado para tu búsqueda'}
                </Text>
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
            <Text style={styles.modalTitle}>Seleccionar cliente</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClienteModal(false)}
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={28} color={HoffColors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearchWrap}>
            <TaskSearchField
              placeholder="Buscar cliente o tipo..."
              value={clienteSearch}
              onChangeText={setClienteSearch}
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={clientesFiltrados}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalListContent}
            renderItem={({ item }) => {
              const empresa = item.tipo === 'empresa';
              return (
                <TouchableOpacity
                  style={[styles.clienteRow, clienteId === item.id && styles.modalItemSelected]}
                  onPress={() => {
                    setClienteId(item.id);
                    setShowClienteModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <ClienteAvatar nombre={item.nombre} fotoUri={item.foto_perfil} size={44} />
                  <View style={styles.clienteTextCol}>
                    <Text style={styles.clienteNombre}>{item.nombre}</Text>
                    <Text style={styles.clienteTipo}>{empresa ? 'Empresa' : 'Particular'}</Text>
                  </View>
                  {clienteId === item.id ? (
                    <Ionicons name="checkmark-circle" size={24} color={HoffColors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={22} color={HoffColors.textMuted} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {clientes.length === 0 ? 'No hay clientes' : 'Ningún resultado para tu búsqueda'}
                </Text>
              </View>
            }
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
            <Text style={styles.modalTitle}>Seleccionar dirección</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDireccionModal(false)}
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={28} color={HoffColors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearchWrap}>
            <TaskSearchField
              placeholder="Buscar dirección o ciudad..."
              value={direccionSearch}
              onChangeText={setDireccionSearch}
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={direccionesFiltradas}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalListContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.direccionRow, direccionId === item.id && styles.modalItemSelected]}
                onPress={() => {
                  setDireccionId(item.id);
                  setShowDireccionModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.clienteIconCircle}>
                  <Ionicons name="location-outline" size={22} color={HoffColors.primary} />
                </View>
                <View style={styles.clienteTextCol}>
                  <Text style={styles.clienteNombre}>{item.direccion_completa}</Text>
                  <Text style={styles.clienteTipo}>{item.ciudad}</Text>
                </View>
                {direccionId === item.id ? (
                  <Ionicons name="checkmark-circle" size={24} color={HoffColors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={22} color={HoffColors.textMuted} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {direcciones.length === 0 ? 'Sin direcciones' : 'Ningún resultado para tu búsqueda'}
                </Text>
              </View>
            }
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
            <Text style={styles.timeModalTitle}>Horas estimadas</Text>
            <Text style={styles.timeModalHint}>Desliza o pulsa el valor en el centro</Text>
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
    </ScrollView>
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: taskSpacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: taskSpacing.md,
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  loadingInline: {
    marginVertical: 12,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: HoffColors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 14,
    backgroundColor: HoffColors.background,
  },
  selectButtonText: {
    fontSize: 16,
    color: HoffColors.text,
    flex: 1,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 14,
    backgroundColor: HoffColors.background,
  },
  dateText: {
    fontSize: 16,
    color: HoffColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
  },
  textArea: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: HoffColors.surface,
    minHeight: 100,
  },
  trabajadoresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: HoffColors.primary,
    borderRadius: taskRadius.md,
    padding: 14,
    backgroundColor: HoffColors.secondaryMuted,
  },
  trabajadoresButtonIcon: {
    marginRight: 8,
  },
  trabajadoresButtonText: {
    fontSize: 16,
    color: HoffColors.primary,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: 16,
    borderRadius: 12,
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
    color: HoffColors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: taskSpacing.lg,
    paddingVertical: taskSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
    backgroundColor: HoffColors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: HoffColors.primary,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSearchWrap: {
    paddingHorizontal: taskSpacing.lg,
    paddingVertical: taskSpacing.md,
    backgroundColor: HoffColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  modalListContent: {
    paddingBottom: taskSpacing.xl,
  },
  trabajadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: taskSpacing.md,
    paddingHorizontal: taskSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
    backgroundColor: HoffColors.surface,
  },
  trabajadorRowSelected: {
    backgroundColor: HoffColors.secondaryMuted,
  },
  trabajadorRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: taskSpacing.md,
  },
  trabajadorIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HoffColors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trabajadorNombre: {
    fontSize: 16,
    color: HoffColors.text,
    flex: 1,
    fontWeight: '500',
  },
  clienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: taskSpacing.md,
    paddingHorizontal: taskSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
    backgroundColor: HoffColors.surface,
    gap: taskSpacing.md,
  },
  direccionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: taskSpacing.md,
    paddingHorizontal: taskSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
    backgroundColor: HoffColors.surface,
    gap: taskSpacing.md,
  },
  clienteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HoffColors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clienteTextCol: {
    flex: 1,
    minWidth: 0,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.text,
  },
  clienteTipo: {
    marginTop: 2,
    fontSize: 13,
    color: HoffColors.textSecondary,
  },
  timeDisplayButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    padding: 14,
    backgroundColor: HoffColors.background,
  },
  timeDisplayText: {
    fontSize: 18,
    color: HoffColors.text,
    fontWeight: '600',
  },
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeModalContent: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    color: HoffColors.primary,
  },
  timeModalHint: {
    fontSize: 13,
    color: HoffColors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  timeModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: taskSpacing.lg,
    gap: 12,
  },
  timeModalCancelButton: {
    flex: 1,
    backgroundColor: HoffColors.background,
    padding: 14,
    borderRadius: taskRadius.md,
    borderWidth: 1,
    borderColor: HoffColors.border,
    alignItems: 'center',
  },
  timeModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: HoffColors.textSecondary,
  },
  timeModalConfirmButton: {
    flex: 1,
    backgroundColor: HoffColors.primary,
    padding: 14,
    borderRadius: taskRadius.md,
    alignItems: 'center',
  },
  timeModalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    width: '100%',
  },
  timePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: HoffColors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timePickerWrapper: {
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: taskRadius.md,
    backgroundColor: HoffColors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  timePickerSlotHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: HoffColors.primary,
    backgroundColor: 'rgba(10, 66, 50, 0.06)',
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    zIndex: 2,
  },
  timePickerItemSelected: {
    backgroundColor: 'transparent',
  },
  timePickerItemDisabled: {
    opacity: 0.3,
  },
  timePickerItemText: {
    fontSize: 16,
    color: HoffColors.textSecondary,
  },
  timePickerItemTextLarge: {
    fontSize: 18,
  },
  timePickerItemTextSelected: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HoffColors.primary,
  },
  timePickerItemTextDisabled: {
    color: HoffColors.textMuted,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: HoffColors.textMuted,
    textAlign: 'center',
  },
  modalItemSelected: {
    backgroundColor: HoffColors.secondaryMuted,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalContent: {
    backgroundColor: HoffColors.surface,
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
    color: HoffColors.text,
  },
  dateModalButton: {
    backgroundColor: HoffColors.primary,
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
