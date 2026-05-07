/**
 * Helpers compartidos para pantallas de tareas (admin y worker).
 */

import { detalleEstadoPillColor } from '@/constants/taskEstadoColors';

export function getEstadoColor(estado: string): string {
  return detalleEstadoPillColor(estado);
}

export function getEstadoText(estado: string): string {
  if (estado === 'aprobada') return 'Aprobada';
  if (estado === 'completada') return 'En revisión';
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

/** Convierte texto HH:MM (o decimal sin ":") a horas en decimal. */
export function tiempoADecimal(tiempo: string): number {
  if (!tiempo || !tiempo.trim()) return 0;

  if (!tiempo.includes(':')) {
    const decimal = parseFloat(tiempo);
    return isNaN(decimal) ? 0 : decimal;
  }

  const partes = tiempo.split(':');
  if (partes.length !== 2) return 0;

  const horas = parseInt(partes[0], 10);
  const minutos = parseInt(partes[1], 10);

  if (isNaN(horas) || isNaN(minutos)) return 0;

  return horas + minutos / 60;
}

/** Vacío es válido (opcional). Acepta decimal sin ":" o HH:MM. */
export function validarFormatoTiempo(tiempo: string): boolean {
  if (!tiempo || !tiempo.trim()) return true;

  if (!tiempo.includes(':')) {
    const decimal = parseFloat(tiempo);
    return !isNaN(decimal) && decimal >= 0;
  }

  const regex = /^(\d{1,2}):([0-5]?\d)$/;
  if (!regex.test(tiempo)) return false;

  const [horas, minutos] = tiempo.split(':').map(Number);
  return horas >= 0 && horas < 1000 && minutos >= 0 && minutos < 60;
}

/** Hora del día HH:MM (0–23 h). Vacío permitido. */
export function validarFormatoHoraReloj(hora: string): boolean {
  if (!hora || !hora.trim()) return true;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hora.trim());
  return Boolean(m);
}
