/**
 * Comparación de fecha de tarea (`fecha_realizacion`) con el día local actual.
 */

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function taskDateStartOfDay(fechaRealizacion: string): Date {
  const d = new Date(fechaRealizacion);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isTaskScheduledToday(fechaRealizacion: string): boolean {
  return taskDateStartOfDay(fechaRealizacion).getTime() === startOfToday().getTime();
}
