/**
 * Helpers compartidos para pantallas de tareas (admin y worker).
 */

export function getEstadoColor(estado: string): string {
  if (estado === 'aprobada') return '#4CAF50';
  if (estado === 'completada') return '#9C27B0';
  if (estado === 'asignada') return '#2196F3';
  if (estado === 'pendiente') return '#FF9800';
  if (estado === 'cancelada') return '#757575';
  return '#9E9E9E';
}

export function getEstadoText(estado: string): string {
  if (estado === 'aprobada') return 'Aprobada ✅';
  if (estado === 'completada') return 'En revisión 👀';
  if (estado === 'asignada') return 'Asignada';
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'cancelada') return 'Cancelada';
  return estado;
}

export function decimalATiempo(decimal: number): string {
  if (!decimal || isNaN(decimal) || decimal < 0) return '0:00';

  const horas = Math.floor(decimal);
  const minutos = Math.round((decimal - horas) * 60);

  const horasFinal = horas + Math.floor(minutos / 60);
  const minutosFinal = minutos % 60;

  return `${horasFinal}:${minutosFinal.toString().padStart(2, '0')}`;
}
