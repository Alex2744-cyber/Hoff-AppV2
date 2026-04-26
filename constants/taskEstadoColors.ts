import { HoffColors } from '@/constants/theme';

/** Colores de estado para listas de tareas (píldoras), alineados a la marca. */
export const taskEstadoColors = {
  aprobada: HoffColors.primary,
  porAprobar: '#6B4C7A',
  pendienteUrgente: '#B71C1C',
  pendienteSinAsignar: '#C26A00',
  asignada: '#1B5E6B',
  cancelada: '#5C5C5C',
  default: '#757575',
  vencida: '#B71C1C',
  hoy: '#C26A00',
  workerAsignada: '#1B5E6B',
} as const;

export function adminListaEstadoColor(
  estado: string,
  fecha: string,
  trabajadores: string | null
): string {
  const tareaDate = new Date(fecha);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  tareaDate.setHours(0, 0, 0, 0);

  if (estado === 'aprobada') return taskEstadoColors.aprobada;
  if (estado === 'completada') return taskEstadoColors.porAprobar;
  if (estado === 'pendiente' && !trabajadores && tareaDate < today) {
    return taskEstadoColors.pendienteUrgente;
  }
  if (estado === 'pendiente' && !trabajadores) return taskEstadoColors.pendienteSinAsignar;
  if (estado === 'asignada') return taskEstadoColors.asignada;
  if (estado === 'cancelada') return taskEstadoColors.cancelada;
  return taskEstadoColors.default;
}

export function workerListaEstadoColor(estado: string, fecha: string): string {
  const tareaDate = new Date(fecha);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  tareaDate.setHours(0, 0, 0, 0);

  if (estado === 'aprobada') return taskEstadoColors.aprobada;
  if (estado === 'completada') return taskEstadoColors.porAprobar;
  if (tareaDate < today) return taskEstadoColors.vencida;
  if (tareaDate.getTime() === today.getTime()) return taskEstadoColors.hoy;
  if (estado === 'asignada') return taskEstadoColors.workerAsignada;
  if (estado === 'cancelada') return taskEstadoColors.cancelada;
  return taskEstadoColors.default;
}

/** Color de píldora de estado en pantallas de detalle (solo `estado` de la tarea). */
export function detalleEstadoPillColor(estado: string): string {
  switch (estado) {
    case 'aprobada':
      return taskEstadoColors.aprobada;
    case 'completada':
      return taskEstadoColors.porAprobar;
    case 'asignada':
      return taskEstadoColors.asignada;
    case 'pendiente':
      return taskEstadoColors.pendienteSinAsignar;
    case 'cancelada':
      return taskEstadoColors.cancelada;
    default:
      return taskEstadoColors.default;
  }
}
