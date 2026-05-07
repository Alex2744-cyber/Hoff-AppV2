import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import { HoffColors } from '@/constants/theme';
import { InfoModal } from '@/components/tareas';

interface IngresosTotales {
  ingresos_totales: number;
  total_tareas_aprobadas: number;
}

/** Respuestas JSON pueden traer DECIMAL como string; mysql/serialización a veces usa bigint */
function parseApiNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const s = String(value).trim().replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseApiInt(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizarIngresosPayload(raw: Record<string, unknown> | undefined): IngresosTotales | null {
  if (!raw) return null;
  const nested = raw.data;
  const src =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : raw;
  const ing = parseApiNumber(src.ingresos_totales);
  const totalRaw = src.total_tareas_aprobadas ?? src.total_tareas_pagadas;
  const total = parseApiInt(totalRaw);
  return {
    ingresos_totales: ing,
    total_tareas_aprobadas: total,
  };
}

export default function FinanzasScreen() {
  const [ingresos, setIngresos] = useState<IngresosTotales | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoModal, setInfoModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const openInfoModal = (
    title: string,
    message: string,
    variant: 'info' | 'success' | 'warning' | 'error' = 'info',
    onClose?: () => void
  ) => {
    setInfoModal({ visible: true, title, message, variant, onClose });
  };

  const closeInfoModal = () => {
    const cb = infoModal.onClose;
    setInfoModal((prev) => ({ ...prev, visible: false, onClose: undefined }));
    if (cb) cb();
  };

  const cargarIngresos = useCallback(async () => {
    try {
      const response = await api.finanzas.getIngresosTotales();
      if (response.success && response.data) {
        const n = normalizarIngresosPayload(response.data as Record<string, unknown>);
        if (n) setIngresos(n);
        else setIngresos(null);
      } else {
        openInfoModal('Error', response.error || 'Error al cargar ingresos', 'error');
      }
    } catch (error) {
      console.error('Error cargando ingresos:', error);
      openInfoModal('Error', 'Error al cargar ingresos', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarIngresos();
    }, [cargarIngresos])
  );

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
        <Text style={styles.headerSubtitle}>Ingresos por tareas aprobadas</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.cardLabel}>Ingresos Totales</Text>
        <Text style={styles.cardAmount}>
          {formatearMoneda(ingresos.ingresos_totales)}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.cardSubtext}>
          {ingresos.total_tareas_aprobadas} tarea{ingresos.total_tareas_aprobadas !== 1 ? 's' : ''} en registro permanente
        </Text>
      </View>

      <View style={styles.infoSection}>
        <TouchableOpacity
          style={styles.infoToggleButton}
          onPress={() => setShowInfo((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showInfo ? 'Ocultar información de ingresos' : 'Mostrar información de ingresos'}
        >
          <View style={styles.infoToggleLeft}>
            <Ionicons name="information-circle-outline" size={18} color={HoffColors.primary} />
            <Text style={styles.infoToggleText}>Más información</Text>
          </View>
          <Ionicons
            name={showInfo ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={18}
            color={HoffColors.primary}
          />
        </TouchableOpacity>

        {showInfo && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              La suma del valor del servicio de cada tarea se consolida cuando la tarea queda aprobada en
              el registro permanente. Este resumen no contempla cobros manuales externos.
            </Text>
          </View>
        )}
      </View>
      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        variant={infoModal.variant}
        onPrimary={closeInfoModal}
      />
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
  infoSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  infoToggleButton: {
    backgroundColor: HoffColors.surface,
    borderWidth: 1,
    borderColor: HoffColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: HoffColors.primary,
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: HoffColors.secondaryMuted,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: HoffColors.primary,
  },
  infoText: {
    fontSize: 14,
    color: HoffColors.primaryDark,
    lineHeight: 20,
  },
});

