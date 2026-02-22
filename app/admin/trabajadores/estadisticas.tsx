import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../services/api';
import { decimalATiempo } from '@/utils/tareas';

export default function EstadisticasTrabajadorScreen() {
  const router = useRouter();
  const { id, nombre } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [horasAprobadas, setHorasAprobadas] = useState<any[]>([]);
  const [totalHorasAprobadas, setTotalHorasAprobadas] = useState(0);
  const [tareasAprobadas, setTareasAprobadas] = useState<any[]>([]);
  const [totalTareasAprobadas, setTotalTareasAprobadas] = useState(0);
  const [mes, setMes] = useState(new Date().getMonth() + 1); // 1-12
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    loadEstadisticas();
  }, [id, mes, anio]);

  const loadEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Cargar horas aprobadas (desde detalle_horas_aprobadas)
      const responseHoras = await api.getHorasTrabajadas(Number(id), mes, anio);
      if (responseHoras.success && responseHoras.data) {
        setHorasAprobadas(responseHoras.data);
        setTotalHorasAprobadas(responseHoras.total_horas || 0);
      }
      
      // Cargar tareas aprobadas (resumen por tarea)
      const responseTareas = await api.getTareasAprobadas(Number(id), mes, anio);
      if (responseTareas.success && responseTareas.data) {
        setTareasAprobadas(responseTareas.data);
        setTotalTareasAprobadas(responseTareas.total_tareas || 0);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEstadisticas();
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getAniosDisponibles = () => {
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let i = anioActual; i >= anioActual - 5; i--) {
      anios.push(i);
    }
    return anios;
  };

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    if (direccion === 'anterior') {
      if (mes === 1) {
        setMes(12);
        setAnio(anio - 1);
      } else {
        setMes(mes - 1);
      }
    } else {
      if (mes === 12) {
        setMes(1);
        setAnio(anio + 1);
      } else {
        setMes(mes + 1);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Filtros de fecha */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📅 Filtrar por Período</Text>
        
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => cambiarMes('anterior')}
          >
            <Text style={styles.filterButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Mes</Text>
              <View style={styles.filterValueContainer}>
                <Text style={styles.filterValue}>{meses[mes - 1]}</Text>
              </View>
            </View>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Año</Text>
              <View style={styles.filterValueContainer}>
                <Text style={styles.filterValue}>{anio}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => cambiarMes('siguiente')}
          >
            <Text style={styles.filterButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            const ahora = new Date();
            setMes(ahora.getMonth() + 1);
            setAnio(ahora.getFullYear());
          }}
        >
          <Text style={styles.resetButtonText}>📅 Mes Actual</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen del período */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 Resumen del Período</Text>
        
        <View style={styles.resumenRow}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>{totalTareasAprobadas}</Text>
            <Text style={styles.resumenLabel}>Tareas Aprobadas</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>
              {decimalATiempo(totalHorasAprobadas)}
            </Text>
            <Text style={styles.resumenLabel}>Horas Aprobadas</Text>
          </View>
        </View>
      </View>

      {/* Lista detallada de tareas aprobadas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>✅ Tareas Aprobadas del Mes</Text>
        
        {tareasAprobadas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay tareas aprobadas para {meses[mes - 1]} {anio}
            </Text>
          </View>
        ) : (
          tareasAprobadas.map((tarea, index) => (
            <View key={index} style={styles.registroItem}>
              <View style={styles.registroHeader}>
                <Text style={styles.registroFecha}>
                  {new Date(tarea.fecha_realizacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
                <Text style={styles.registroHoras}>
                  {decimalATiempo(parseFloat(tarea.horas_trabajadas))}
                </Text>
              </View>
              
              <Text style={styles.registroTarea} numberOfLines={2}>
                {tarea.tarea_descripcion || 'Sin descripción'}
              </Text>
              
              <Text style={styles.registroCliente}>
                👤 {tarea.cliente_nombre || 'Cliente no disponible'}
              </Text>
              
              <View style={styles.estadoPagoContainer}>
                <Text style={[
                  styles.estadoPago,
                  tarea.estado_pago === 'pagado' ? styles.estadoPagoPagado : styles.estadoPagoPendiente
                ]}>
                  {tarea.estado_pago === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
                </Text>
              </View>
              
              {tarea.descripcion_horas && (
                <Text style={styles.registroNotas} numberOfLines={2}>
                  📝 {tarea.descripcion_horas}
                </Text>
              )}
            </View>
          ))
        )}
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  filtersContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  filterValueContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  filterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  resumenRow: {
    flexDirection: 'row',
    gap: 16,
  },
  resumenItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resumenValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  registroItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  registroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  registroFecha: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  registroHoras: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  registroTarea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  registroCliente: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  registroNotas: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  estadoPagoContainer: {
    marginTop: 8,
  },
  estadoPago: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  estadoPagoPagado: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  estadoPagoPendiente: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
  },
});


