import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
  Share,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskSection } from './TaskSection';
import { HoffColors } from '@/constants/theme';
import { taskSpacing, taskRadius } from '@/constants/taskUi';

type Props = {
  imageUris: string[];
  title?: string;
  wrapInSection?: boolean;
};

const THUMB = 86;

/**
 * Cinta de miniaturas y visor a pantalla completa (fondo oscuro) con desliz.
 */
export function TaskEvidenceViewer({
  imageUris,
  title = 'Evidencia del trabajo',
  wrapInSection = true,
}: Props) {
  const { width: fullW } = useWindowDimensions();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (viewerOpen && scrollRef.current) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({ x: index * fullW, animated: false });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [viewerOpen, fullW, index]);

  if (!imageUris || imageUris.length === 0) {
    return null;
  }

  const onScrollView = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / fullW);
    if (i >= 0 && i < imageUris.length) {
      setIndex(i);
    }
  };

  const openAt = (i: number) => {
    setIndex(i);
    setViewerOpen(true);
  };

  const handleShareCurrent = async () => {
    const uri = imageUris[index];
    if (!uri) {
      Alert.alert('Error', 'No hay imagen para compartir');
      return;
    }
    try {
      await Share.share({
        message: uri,
        url: uri,
      });
    } catch {
      Alert.alert('Error', 'No se pudo compartir la imagen');
    }
  };

  const content = (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbRow}
        keyboardShouldPersistTaps="handled"
      >
        {imageUris.map((uri, i) => (
          <TouchableOpacity
            key={`${uri}-${i}`}
            style={styles.thumbWrap}
            onPress={() => openAt(i)}
            activeOpacity={0.85}
            accessibilityLabel={`Evidencia ${i + 1} de ${imageUris.length}`}
          >
            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.thumbDim}>
              <Ionicons name="expand-outline" size={20} color={HoffColors.white} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={viewerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setViewerOpen(false)}
      >
        <Pressable style={styles.viewerOverlay} onPress={() => setViewerOpen(false)}>
          <Pressable style={styles.viewerBody} onPress={(e) => e.stopPropagation()}>
            <View style={styles.viewerHeader}>
              <Text style={styles.viewerCounter}>
                {index + 1} / {imageUris.length}
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleShareCurrent}
                  style={styles.actionBtn}
                  accessibilityLabel="Compartir evidencia actual"
                >
                  <Ionicons name="share-social-outline" size={24} color={HoffColors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewerOpen(false)}
                  style={styles.actionBtn}
                  accessibilityLabel="Cerrar visor"
                >
                  <Ionicons name="close" size={28} color={HoffColors.white} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScrollView}
              scrollEventThrottle={16}
            >
              {imageUris.map((uri, i) => (
                <View key={`f-${i}`} style={[styles.slide, { width: fullW }]}>
                  <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
            <Text style={styles.viewerHint}>Desliza para ver otras fotos</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );

  if (wrapInSection) {
    return <TaskSection title={title}>{content}</TaskSection>;
  }
  return <View style={styles.embed}>{content}</View>;
}

const styles = StyleSheet.create({
  embed: {
    marginTop: 0,
  },
  thumbRow: {
    gap: taskSpacing.sm,
    paddingVertical: taskSpacing.xs,
  },
  thumbWrap: {
    position: 'relative',
    width: THUMB,
    height: THUMB,
    borderRadius: taskRadius.md,
    overflow: 'hidden',
    backgroundColor: HoffColors.background,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  viewerBody: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: taskSpacing.md,
    paddingTop: taskSpacing.lg,
    paddingBottom: taskSpacing.sm,
  },
  viewerCounter: {
    color: HoffColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: taskSpacing.xs,
  },
  actionBtn: {
    padding: 8,
  },
  slide: {
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%' as const,
    minHeight: 400,
  },
  viewerHint: {
    textAlign: 'center',
    color: HoffColors.textSecondary,
    fontSize: 13,
    paddingBottom: taskSpacing.lg,
  },
});
