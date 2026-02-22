import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';

interface IngresosTotales {
  ingresos_totales: number;
  total_tareas_pagadas: number;
}

export default function FinanzasScreen() {
  const [ingresos, setIngresos] = useState<IngresosTotales | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarIngresos = async () => {
    try {
      const response = await api.finanzas.getIngresosTotales();
      if (response.success && response.data) {
        setIngresos(response.data);
      } else {
        Alert.alert('Error', response.error || 'Error al cargar ingresos');
      }
    } catch (error) {
      console.error('Error cargando ingresos:', error);
      Alert.alert('Error', 'Error al cargar ingresos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarIngresos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarIngresos();
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(valor);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={HoffColors.primary} />
        <Text style={styles.loadingText}>Cargando ingresos...</Text>
      </View>
    );
  }

  if (!ingresos) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No se pudo cargar la información</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="wallet-outline" size={28} color={HoffColors.white} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Finanzas</Text>
        </View>
        <Text style={styles.headerSubtitle}>Ingresos de tareas pagadas</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.cardLabel}>Ingresos Totales</Text>
        <Text style={styles.cardAmount}>
          {formatearMoneda(ingresos.ingresos_totales)}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.cardSubtext}>
          {ingresos.total_tareas_pagadas} tarea{ingresos.total_tareas_pagadas !== 1 ? 's' : ''} pagada{ingresos.total_tareas_pagadas !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Este monto representa la suma de todas las tareas aprobadas que han sido marcadas como pagadas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HoffColors.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  centerContainer: {
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
  errorText: {
    fontSize: 16,
    color: HoffColors.accentDark,
  },
  header: {
    backgroundColor: HoffColors.primary,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: HoffColors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: HoffColors.secondaryMuted,
  },
  mainCard: {
    backgroundColor: HoffColors.surface,
    margin: 20,
    marginTop: -20,
    padding: 24,
    borderRadius: 16,
    shadowColor: HoffColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    color: HoffColors.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: HoffColors.accent,
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: HoffColors.border,
    marginBottom: 16,
  },
  cardSubtext: {
    fontSize: 14,
    color: HoffColors.textMuted,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: HoffColors.secondaryMuted,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: HoffColors.primary,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: HoffColors.primaryDark,
    lineHeight: 20,
  },
});

