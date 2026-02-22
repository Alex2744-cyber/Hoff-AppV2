/**
 * Paleta de colores Hoff House & Office Cleaning Services.
 * Verde esmeralda, dorado y blanco según identidad de marca.
 */
export const HoffColors = {
  /** Verde principal - fondos, headers */
  primary: '#0A4232',
  /** Verde muy oscuro - gradientes, sombras */
  primaryDark: '#062a21',
  /** Dorado - botones primarios, iconos activos */
  accent: '#D4AF37',
  /** Dorado oscuro - hover, sombra del acento */
  accentDark: '#A67C00',
  /** Blanco - texto sobre verde */
  white: '#FFFFFF',
  /** Verde claro - etiquetas, secundario */
  secondary: '#B0E680',
  /** Verde claro alternativo */
  secondaryMuted: '#C0D89A',
  /** Fondo de pantalla */
  background: '#f5f5f5',
  /** Cards, superficies */
  surface: '#FFFFFF',
  /** Bordes */
  border: '#E0E0E0',
  /** Texto principal */
  text: '#333333',
  /** Texto secundario */
  textSecondary: '#666666',
  /** Texto terciario */
  textMuted: '#999999',
} as const;

export type HoffColorsType = typeof HoffColors;
