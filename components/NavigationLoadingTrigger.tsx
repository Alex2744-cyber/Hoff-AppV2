import { useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';

const NAV_LOADING_DURATION_MS = 350;

/**
 * Cuando cambia la ruta (segments), muestra el overlay de carga
 * durante NAV_LOADING_DURATION_MS y luego lo oculta.
 */
export function NavigationLoadingTrigger() {
  const segments = useSegments();
  const { setNavigating } = useNavigationLoading();
  const prevSegmentsRef = useRef<string>(JSON.stringify(segments));
  const isFirstRender = useRef(true);

  useEffect(() => {
    const key = JSON.stringify(segments);
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSegmentsRef.current = key;
      return;
    }
    if (key === prevSegmentsRef.current) return;
    prevSegmentsRef.current = key;

    setNavigating(true);
    const t = setTimeout(() => {
      setNavigating(false);
    }, NAV_LOADING_DURATION_MS);
    return () => clearTimeout(t);
  }, [segments, setNavigating]);

  return null;
}
