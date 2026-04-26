import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { HoffColors } from '@/constants/theme';

type Props = {
  nombre: string;
  fotoUri?: string | null;
  size?: number;
};

export function ClienteAvatar({ nombre, fotoUri, size = 48 }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [fotoUri]);

  const initial = (nombre?.trim()?.charAt(0) || '?').toUpperCase();
  const uri = fotoUri?.trim();
  const showImage = Boolean(uri) && !failed;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initial, { fontSize: Math.round(size * 0.38) }]}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HoffColors.border,
    backgroundColor: HoffColors.surface,
  },
  image: {
    backgroundColor: HoffColors.surface,
  },
  placeholder: {
    backgroundColor: HoffColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '700',
    color: HoffColors.white,
  },
});
