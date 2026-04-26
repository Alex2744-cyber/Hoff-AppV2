import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius, taskShadowCard } from '@/constants/taskUi';
import { TaskScreenContainer } from '@/components/tareas/TaskScreenContainer';
import { ChangePasswordModal } from '@/components/perfil/ChangePasswordModal';
import { ClienteAvatar } from '@/components/clientes/ClienteAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLogoutWithConfirm } from '@/hooks/useLogoutWithConfirm';

export default function PerfilScreen() {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const logoutWithConfirm = useLogoutWithConfirm();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshUser();
    }, [refreshUser])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Perfil',
      headerStyle: { backgroundColor: HoffColors.primary },
      headerTintColor: HoffColors.white,
      headerTitleStyle: { fontWeight: 'bold' },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={{ paddingRight: 16 }}
          accessibilityLabel="Opciones del perfil"
        >
          <Ionicons name="ellipsis-vertical" size={24} color={HoffColors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <TaskScreenContainer bottomInsetExtra={Platform.OS === 'web' ? 8 : 0}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={20} color={HoffColors.primary} />
            <Text style={styles.sectionTitle}>Mi perfil</Text>
          </View>

          <View style={styles.avatarSection}>
            <ClienteAvatar nombre={user?.nombre || '?'} fotoUri={user?.foto_perfil} size={80} />
          </View>
          <Text style={styles.userName}>{user?.nombre}</Text>
          <Text style={styles.userUsername}>@{user?.usuario}</Text>

          <View style={styles.roleRow}>
            <Ionicons name="construct-outline" size={18} color={HoffColors.primary} />
            <Text style={styles.roleText}>Trabajador</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Cuenta</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Usuario</Text>
            <Text style={styles.detailValue}>@{user?.usuario}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>ID</Text>
            <Text style={styles.detailValue}>#{user?.id}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Seguridad</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setPasswordModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Cambiar contraseña"
          >
            <Ionicons name="key-outline" size={22} color={HoffColors.primary} />
            <Text style={styles.actionText}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color={HoffColors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>Opciones</Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                setMenuOpen(false);
                router.push('/worker/perfil-editar');
              }}
            >
              <Ionicons name="create-outline" size={22} color={HoffColors.text} />
              <Text style={styles.menuRowText}>Editar perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuRow, styles.menuRowDanger]}
              onPress={() => {
                setMenuOpen(false);
                logoutWithConfirm();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color="#c62828" />
              <Text style={[styles.menuRowText, styles.menuRowTextDanger]}>Cerrar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        usuario={user?.usuario}
      />
    </TaskScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: HoffColors.background },
  content: { paddingBottom: taskSpacing.xxl },
  card: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    padding: taskSpacing.lg,
    marginBottom: taskSpacing.lg,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: taskSpacing.sm, marginBottom: taskSpacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: HoffColors.text },
  avatarSection: { alignItems: 'center', marginBottom: taskSpacing.lg },
  userName: { fontSize: 22, fontWeight: '700', color: HoffColors.text, textAlign: 'center', marginBottom: taskSpacing.xs },
  userUsername: { fontSize: 15, fontWeight: '600', color: HoffColors.primary, textAlign: 'center', marginBottom: taskSpacing.md },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: taskSpacing.sm,
    alignSelf: 'center',
    paddingHorizontal: taskSpacing.lg,
    paddingVertical: taskSpacing.sm,
    borderRadius: taskRadius.lg,
    backgroundColor: HoffColors.background,
    borderWidth: 1,
    borderColor: HoffColors.border,
  },
  roleText: { fontSize: 15, fontWeight: '600', color: HoffColors.primary },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: HoffColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: taskSpacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: taskSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 14, color: HoffColors.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: 14, color: HoffColors.text, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: taskSpacing.md, paddingVertical: taskSpacing.sm },
  actionText: { flex: 1, fontSize: 16, fontWeight: '600', color: HoffColors.text },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: taskSpacing.lg },
  menuSheet: {
    backgroundColor: HoffColors.surface,
    borderRadius: taskRadius.lg,
    paddingVertical: taskSpacing.sm,
    borderWidth: 1,
    borderColor: HoffColors.border,
    ...taskShadowCard,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: HoffColors.text,
    paddingHorizontal: taskSpacing.lg,
    paddingBottom: taskSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: HoffColors.border,
    marginBottom: taskSpacing.xs,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: taskSpacing.md, paddingVertical: 14, paddingHorizontal: taskSpacing.lg },
  menuRowDanger: { borderTopWidth: 1, borderTopColor: HoffColors.border, marginTop: taskSpacing.xs },
  menuRowText: { fontSize: 16, color: HoffColors.text },
  menuRowTextDanger: { color: '#c62828', fontWeight: '600' },
  menuCancel: { alignItems: 'center', paddingVertical: taskSpacing.md, marginTop: taskSpacing.xs },
  menuCancelText: { fontSize: 16, fontWeight: '600', color: HoffColors.textSecondary },
});
