/**
 * Tipos y normalización para listados y detalle de tareas (alineado con la API).
 */

/** Fila de listado: GET /tareas y GET /tareas/trabajador/:id (siempre usar `id` para navegación). */
export interface TareaLista {
  id: number;
  /** Redundante con `id` si el backend envía alias; no usar para lógica nueva. */
  tarea_id?: number;
  fecha_realizacion: string;
  estado: string;
  /** Ausente en listados del trabajador (privacidad). */
  cliente_nombre?: string;
  cliente_tipo?: string;
  direccion_completa: string;
  ciudad: string;
  descripcion_general: string;
  numero_horas?: string | null;
  valor_servicio?: string;
  /** Asignación del trabajador autenticado (GET por trabajador). */
  horas_asignadas?: number | string | null;
  horas_aprobadas?: number | string | null;
  /** HH:MM local acordado para iniciar (asignación). */
  hora_inicio?: string | null;
  /** Solo en listados que usan vista completa; puede faltar en GET por trabajador. */
  trabajadores_asignados?: string | null;
  horas_registradas?: string;
  evidencia_url?: string | null;
  evidencia_path?: string | null;
  evidencia_subida_at?: string | null;
  /** Detalle: fotos al completar (nuevo). Listados suelen no incluir. */
  evidencias?: TareaEvidenciaItem[] | null;
}

export interface TareaEvidenciaItem {
  id: number;
  url: string;
  path: string;
  sort_order: number;
}

export interface TareaTrabajadorDetalle {
  id: number;
  nombre: string;
  foto_perfil?: string | null;
  horas_asignadas?: number | string | null;
  horas_aprobadas?: number | string | null;
  /** HH:MM */
  hora_inicio?: string | null;
  notas?: string | null;
}

export interface RegistroAprobacion {
  aprobacion_id?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  notas_aprobacion?: string | null;
  total_horas_trabajadas?: number | string;
  numero_trabajadores?: number;
  mes_nomina?: number;
  anio_nomina?: number;
  estado_pago?: string;
  fecha_pago?: string | null;
  referencia_pago?: string | null;
}

export interface HoraAprobadaFinal {
  trabajador_id: number;
  trabajador_nombre?: string;
  horas_aprobadas_finales?: number | string;
}

/** Respuesta GET /tareas/:id (detalle completo). */
export interface TareaDetalle {
  id: number;
  cliente_id?: number;
  direccion_id?: number;
  fecha_realizacion: string;
  fecha_creacion?: string;
  descripcion_general: string;
  detalles_especificos?: string | null;
  numero_horas?: number | string | null;
  valor_servicio?: number | string;
  estado: string;
  comentarios_trabajador?: string | null;
  mensaje_rechazo?: string | null;
  /** Legacy; el detalle usa `evidencias` como fuente. */
  evidencia_url?: string | null;
  evidencia_path?: string | null;
  evidencia_subida_at?: string | null;
  /** Fotos al completar (hasta 5 en backend). */
  evidencias?: TareaEvidenciaItem[];
  aprobada_por?: number | null;
  fecha_aprobacion?: string | null;
  cliente_nombre?: string;
  cliente_tipo?: string;
  cliente_telefono?: string | null;
  cliente_email?: string | null;
  cliente_administrador_nombre?: string | null;
  cliente_administrador_telefono?: string | null;
  cliente_administrador_email?: string | null;
  direccion_completa?: string;
  ciudad?: string;
  codigo_postal?: string | null;
  trabajadores?: TareaTrabajadorDetalle[];
  registro_aprobacion?: RegistroAprobacion;
  horas_aprobadas_finales?: HoraAprobadaFinal[];
  /** Si existe en la API / vista. */
  ultima_actualizacion?: string | null;
  notas_internas?: string | null;
}

/** Unifica `id` (tabla tareas) y `tarea_id` (alias legacy) para listados. */
export function normalizeTareaListItem(raw: Record<string, unknown>): TareaLista {
  const idRaw = raw.id ?? raw.tarea_id;
  const id = typeof idRaw === 'number' && !Number.isNaN(idRaw) ? idRaw : Number(idRaw);
  const safeId = Number.isFinite(id) && id > 0 ? id : 0;
  const merged = { ...raw, id: safeId, tarea_id: safeId } as unknown as TareaLista;
  return merged;
}
