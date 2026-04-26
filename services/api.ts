import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  normalizeTareaListItem,
  type TareaLista,
  type TareaDetalle,
} from '../types/tareas';

export type { TareaLista, TareaDetalle } from '../types/tareas';
/** @deprecated Usar TareaLista; se mantiene el nombre para imports existentes. */
export type Tarea = TareaLista;

/** Normaliza la base de la API (termina en /api) */
const normalizeApiBase = (url: string): string => {
  const u = url.trim().replace(/\/$/, '');
  if (u.endsWith('/api')) return u;
  return `${u}/api`;
};

/**
 * Base de la API (siempre termina en /api).
 * Prioridad:
 * 1) EXPO_PUBLIC_API_URL (obligatoria en builds de producción / Vercel para apuntar a tu backend)
 * 2) __DEV__: localhost / emulador / IP LAN por defecto
 * 3) Sin env en producción: expo.extra.apiUrl (EAS) si existe
 * 4) Último recurso: localhost (fallará en cliente salvo túnel; evita apuntar a un Railway ajeno)
 */
const getBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return normalizeApiBase(fromEnv);
  }

  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    }
    if (Platform.OS === 'android' && !Constants.isDevice) {
      return 'http://10.0.2.2:3000/api';
    }
    if (Platform.OS === 'ios' && !Constants.isDevice) {
      return 'http://localhost:3000/api';
    }
    return 'http://192.168.1.110:3000/api';
  }

  const extraUrl =
    typeof Constants.expoConfig?.extra === 'object' &&
    Constants.expoConfig.extra !== null &&
    'apiUrl' in Constants.expoConfig.extra
      ? String((Constants.expoConfig.extra as { apiUrl?: string }).apiUrl ?? '').trim()
      : '';
  if (extraUrl) {
    return normalizeApiBase(extraUrl);
  }

  if (!__DEV__) {
    console.warn(
      '[Hoff API] Define EXPO_PUBLIC_API_URL en el build (Vercel/EAS) con la URL pública de tu backend, ej. https://tu-servicio.up.railway.app'
    );
  }
  return 'http://localhost:3000/api';
};

const API_URL = getBaseUrl();

export const AUTH_TOKEN_KEY = 'authToken';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export async function getStoredAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setStoredAuthToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/** Limpia usuario + token (logout y 401). */
export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove(['user', AUTH_TOKEN_KEY]);
}

async function buildAuthHeaders(
  extra?: HeadersInit,
  opts?: { omitContentType?: boolean }
): Promise<Record<string, string>> {
  const token = await getStoredAuthToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!opts?.omitContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    Object.assign(headers, extra as Record<string, string>);
  }
  return headers;
}

// Tipos
export interface User {
  id: number;
  usuario: string;
  nombre: string;
  descripcion: string | null;
  foto_perfil: string | null;
  tipo: 'admin' | 'trabajador';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Trabajador {
  id: number;
  usuario: string;
  nombre: string;
  descripcion: string | null;
  foto_perfil: string | null;
  fecha_creacion?: string;
  activo: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  tipo: 'empresa' | 'particular';
  nombre_empresa: string | null;
  telefono: string | null;
  email: string | null;
  descripcion: string | null;
  foto_perfil?: string | null;
}

// Función helper para hacer peticiones
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = await buildAuthHeaders(options.headers as Record<string, string> | undefined, {
      omitContentType: isFormData,
    });
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: ApiResponse<T> & { error?: string } = {} as ApiResponse<T> & { error?: string };
    try {
      data = (await response.json()) as ApiResponse<T> & { error?: string };
    } catch {
      /* cuerpo vacío o no JSON */
    }

    if (response.status === 401) {
      await clearAuthSession();
      onUnauthorized?.();
    }

    if (!response.ok) {
      throw new Error(data.error || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API Methods
const api = {
  // ==================== AUTENTICACIÓN ====================

  login: async (usuario: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en el login');
    }

    return data as LoginResponse;
  },

  changePassword: async (payload: {
    password_actual: string;
    password_nueva: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const headers = await buildAuthHeaders();
    const response = await fetch(`${API_URL}/auth/password`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    let data: { success?: boolean; error?: string } = {};
    try {
      data = (await response.json()) as { success?: boolean; error?: string };
    } catch {
      /* ignore */
    }
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'No se pudo cambiar la contraseña',
      };
    }
    return { success: true };
  },

  getAuthMe: async (): Promise<ApiResponse<User>> => {
    return apiRequest<User>('/auth/me');
  },

  updateAuthMe: async (payload: {
    nombre?: string;
    descripcion?: string | null;
    foto_perfil?: string | null;
  }): Promise<ApiResponse<User>> => {
    return apiRequest<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // ==================== TAREAS ====================
  
  getTareas: async (): Promise<ApiResponse<TareaLista[]>> => {
    const res = await apiRequest<Record<string, unknown>[]>('/tareas');
    if (res.success && Array.isArray(res.data)) {
      return { ...res, data: res.data.map((row) => normalizeTareaListItem(row)) };
    }
    return res as unknown as ApiResponse<TareaLista[]>;
  },

  getTareaById: async (id: number): Promise<ApiResponse<TareaDetalle>> => {
    return apiRequest<TareaDetalle>(`/tareas/${id}`);
  },

  getTareasByTrabajador: async (trabajadorId: number): Promise<ApiResponse<TareaLista[]>> => {
    const res = await apiRequest<Record<string, unknown>[]>(
      `/tareas/trabajador/${trabajadorId}`
    );
    if (res.success && Array.isArray(res.data)) {
      return { ...res, data: res.data.map((row) => normalizeTareaListItem(row)) };
    }
    return res as unknown as ApiResponse<TareaLista[]>;
  },

  createTarea: async (tareaData: any): Promise<ApiResponse<any>> => {
    return apiRequest('/tareas', {
      method: 'POST',
      body: JSON.stringify(tareaData),
    });
  },

  updateTarea: async (id: number, tareaData: any): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tareaData),
    });
  },

  /** Si omites `horasAsignadas`, el servidor usa la duración de la tarea (`numero_horas`) y la capa al máximo. */
  asignarTrabajador: async (
    tareaId: number,
    trabajadorId: number,
    horasAsignadas?: number
  ): Promise<ApiResponse<any>> => {
    const body: Record<string, unknown> = { trabajador_id: trabajadorId };
    if (horasAsignadas !== undefined && horasAsignadas !== null && Number.isFinite(horasAsignadas)) {
      body.horas_asignadas = horasAsignadas;
    }
    return apiRequest(`/tareas/${tareaId}/asignar`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  actualizarHorasTrabajador: async (
    tareaId: number,
    trabajadorId: number,
    horasAsignadas: number
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${tareaId}/trabajador/${trabajadorId}/horas`, {
      method: 'PUT',
      body: JSON.stringify({
        horas_asignadas: horasAsignadas,
      }),
    });
  },

  desasignarTrabajador: async (
    tareaId: number,
    trabajadorId: number
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${tareaId}/trabajador/${trabajadorId}`, {
      method: 'DELETE',
    });
  },

  cancelarTarea: async (id: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== TRABAJADORES ====================
  
  getTrabajadores: async (): Promise<ApiResponse<Trabajador[]>> => {
    return apiRequest<Trabajador[]>('/trabajadores');
  },

  getTrabajadorById: async (id: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/trabajadores/${id}`);
  },

  createTrabajador: async (trabajadorData: any): Promise<ApiResponse<any>> => {
    return apiRequest('/trabajadores', {
      method: 'POST',
      body: JSON.stringify(trabajadorData),
    });
  },

  updateTrabajador: async (id: number, trabajadorData: any): Promise<ApiResponse<any>> => {
    return apiRequest(`/trabajadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trabajadorData),
    });
  },

  deleteTrabajador: async (id: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/trabajadores/${id}`, {
      method: 'DELETE',
    });
  },

  getHorasTrabajadas: async (id: number, mes?: number, anio?: number): Promise<ApiResponse<any>> => {
    let url = `/trabajadores/${id}/horas`;
    if (mes && anio) {
      url += `?mes=${mes}&anio=${anio}`;
    }
    return apiRequest(url);
  },

  getHorasAsignadas: async (id: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/trabajadores/${id}/horas-asignadas`);
  },

  getTareasAprobadas: async (id: number, mes?: number, anio?: number): Promise<ApiResponse<any>> => {
    let url = `/trabajadores/${id}/tareas-aprobadas`;
    if (mes && anio) {
      url += `?mes=${mes}&anio=${anio}`;
    }
    return apiRequest(url);
  },

  // ==================== CLIENTES ====================
  
  getClientes: async (): Promise<ApiResponse<Cliente[]>> => {
    return apiRequest<Cliente[]>('/clientes');
  },

  getClienteById: async (id: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/clientes/${id}`);
  },

  createCliente: async (clienteData: any): Promise<ApiResponse<any>> => {
    return apiRequest('/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  },

  updateCliente: async (id: number, clienteData: any): Promise<ApiResponse<any>> => {
    return apiRequest(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData),
    });
  },

  // ==================== DIRECCIONES ====================
  
  getDirecciones: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/direcciones');
  },

  getDireccionesByCliente: async (clienteId: number): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>(`/direcciones/cliente/${clienteId}`);
  },

  getDireccionById: async (id: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/direcciones/${id}`);
  },

  createDireccion: async (direccionData: any): Promise<ApiResponse<any>> => {
    return apiRequest('/direcciones', {
      method: 'POST',
      body: JSON.stringify(direccionData),
    });
  },

  updateDireccion: async (id: number, direccionData: any): Promise<ApiResponse<any>> => {
    return apiRequest(`/direcciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(direccionData),
    });
  },

  deleteDireccion: async (id: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/direcciones/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== HORAS ====================
  
  registrarHoras: async (horasData: any): Promise<ApiResponse<any>> => {
    return apiRequest('/horas', {
      method: 'POST',
      body: JSON.stringify(horasData),
    });
  },

  getHorasByTarea: async (tareaId: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/horas/tarea/${tareaId}`);
  },

  // ==================== GESTIÓN DE ESTADOS DE TAREAS ====================

  // Completar tarea (trabajador marca que terminó; la tarea puede estar asignada o devuelta)
  completarTarea: async (
    tareaId: number, 
    trabajadorId: number,
    comentarios?: string,
    options?: { evidencias?: { url: string; path: string }[] } | { evidencia_url?: string | null; evidencia_path?: string | null }
  ): Promise<ApiResponse<any>> => {
    const body: Record<string, unknown> = {
      trabajador_id: trabajadorId,
      comentarios: comentarios,
    };
    if (options) {
      if ('evidencias' in options) {
        body.evidencias = (options as { evidencias: { url: string; path: string }[] }).evidencias;
      } else {
        const o = options as { evidencia_url?: string | null; evidencia_path?: string | null };
        body.evidencia_url = o.evidencia_url ?? null;
        body.evidencia_path = o.evidencia_path ?? null;
      }
    }
    return apiRequest(`/tareas/${tareaId}/completar`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // Aprobar tarea (admin aprueba trabajo completado)
  aprobarTarea: async (
    tareaId: number, 
    adminId: number, 
    notasAprobacion?: string,
    horasTrabajadores?: { trabajador_id: number; horas: number }[]
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${tareaId}/aprobar`, {
      method: 'POST',
      body: JSON.stringify({ 
        admin_id: adminId, 
        notas_aprobacion: notasAprobacion,
        horas_trabajadores: horasTrabajadores
      }),
    });
  },

  // Devolver tarea completada (admin devuelve tarea con mensaje)
  devolverTarea: async (
    tareaId: number,
    adminId: number,
    mensaje: string,
    estadoAnterior?: string
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${tareaId}/devolver`, {
      method: 'PUT',
      body: JSON.stringify({
        admin_id: adminId,
        mensaje: mensaje,
        estado_anterior: estadoAnterior
      }),
    });
  },

  // ==================== MEDIA (subida de imágenes) ====================

  /**
   * Sube una imagen (multipart). El campo `tipo` debe ir en el FormData antes del archivo.
   * Respuesta: { url, path, tipo } — guardar `url` en `foto_perfil` vía create/update JSON.
   */
  uploadMedia: async (
    formData: FormData
  ): Promise<ApiResponse<{ url: string; path: string; tipo: string }>> => {
    const token = await getStoredAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    let data: ApiResponse<{ url: string; path: string; tipo: string }> & { error?: string } =
      {} as ApiResponse<{ url: string; path: string; tipo: string }> & { error?: string };
    try {
      data = (await response.json()) as ApiResponse<{ url: string; path: string; tipo: string }> & {
        error?: string;
      };
    } catch {
      /* cuerpo vacío o no JSON */
    }
    if (response.status === 401) {
      await clearAuthSession();
      onUnauthorized?.();
    }
    if (!response.ok) {
      throw new Error(data.error || 'Error al subir la imagen');
    }
    return data;
  },

  // Finanzas
  finanzas: {
    getIngresosTotales: async (): Promise<ApiResponse<any>> => {
      return apiRequest('/finanzas/ingresos');
    },
  },
};

export default api;

