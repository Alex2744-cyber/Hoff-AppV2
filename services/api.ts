
// Configurar URL base según el entorno
const getBaseUrl = () => {
  if (__DEV__) {
    // PARA DISPOSITIVO FÍSICO: Usar IP de la PC
    // Si estás usando Expo Go en tu celular, necesitas la IP de tu PC
    return 'http://192.168.1.110:3000/api';
    
    // Para emuladores (descomenta si usas emulador):
    // if (Platform.OS === 'android') {
    //   return 'http://10.0.2.2:3000/api';  // Emulador Android
    // } else {
    //   return 'http://localhost:3000/api';  // iOS Simulator
    // }
  }
  // En producción
  return 'hoff-backend-production.up.railway.app';
};

const API_URL = getBaseUrl();

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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Tarea {
  tarea_id: number;
  fecha_realizacion: string;
  estado: string;
  cliente_nombre: string;
  cliente_tipo: string;
  direccion_completa: string;
  ciudad: string;
  descripcion_general: string;
  numero_horas: string | null;
  valor_servicio: string;
  trabajadores_asignados: string | null;
  horas_registradas: string;
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
}

// Función helper para hacer peticiones
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

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

    return data; // Retorna { success, message, user } con user.tipo
  },

  // ==================== TAREAS ====================
  
  getTareas: async (): Promise<ApiResponse<Tarea[]>> => {
    return apiRequest<Tarea[]>('/tareas');
  },

  getTareaById: async (id: number): Promise<ApiResponse<Tarea>> => {
    return apiRequest<Tarea>(`/tareas/${id}`);
  },

  getTareasByTrabajador: async (trabajadorId: number): Promise<ApiResponse<Tarea[]>> => {
    return apiRequest<Tarea[]>(`/tareas/trabajador/${trabajadorId}`);
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

  asignarTrabajador: async (
    tareaId: number,
    trabajadorId: number,
    horasAsignadas?: number
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${tareaId}/asignar`, {
      method: 'POST',
      body: JSON.stringify({
        trabajador_id: trabajadorId,
        horas_asignadas: horasAsignadas || null,
      }),
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
    comentarios?: string
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${tareaId}/completar`, {
      method: 'PUT',
      body: JSON.stringify({ 
        trabajador_id: trabajadorId,
        comentarios: comentarios 
      }),
    });
  },

  // Aprobar tarea (admin aprueba trabajo completado)
  aprobarTarea: async (
    tareaId: number, 
    adminId: number, 
    notasAprobacion?: string,
    horasTrabajadores?: Array<{ trabajador_id: number; horas: number }>
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

  // Marcar tarea como pagada (admin)
  marcarTareaComoPagada: async (
    tareaId: number,
    referenciaPago?: string
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/tareas/${tareaId}/marcar-pagado`, {
      method: 'PUT',
      body: JSON.stringify({
        referencia_pago: referenciaPago || null,
      }),
    });
  },

  // Finanzas
  finanzas: {
    getIngresosTotales: async (): Promise<ApiResponse<any>> => {
      return apiRequest('/finanzas/ingresos');
    },
  },
};

export default api;

