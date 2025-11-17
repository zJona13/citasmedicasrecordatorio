const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiError {
  error: string;
  errors?: Array<{ msg: string; param: string }>;
}

const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth: boolean = false
): Promise<T> => {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si recibimos un 401 o 403, el token es inválido o expiró (solo si no es ruta pública)
  if ((response.status === 401 || response.status === 403) && !skipAuth) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Solo redirigir si no estamos ya en la página de auth
    if (window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    const error: ApiError = await response.json().catch(() => ({
      error: 'Token inválido o expirado',
    }));
    throw new Error(error.error || 'Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'Error desconocido',
    }));
    throw new Error(error.error || 'Error en la petición');
  }

  return response.json();
};

export const api = {
  get<T>(endpoint: string, skipAuth = false): Promise<T> {
    return request<T>(endpoint, { method: 'GET' }, skipAuth);
  },

  post<T>(endpoint: string, data?: unknown, skipAuth = false): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, skipAuth);
  },

  put<T>(endpoint: string, data?: unknown, skipAuth = false): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, skipAuth);
  },

  patch<T>(endpoint: string, data?: unknown, skipAuth = false): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, skipAuth);
  },

  delete<T>(endpoint: string, skipAuth = false): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' }, skipAuth);
  },
};

// Helper functions for appointments
export interface Appointment {
  id: string;
  time: string;
  patient: string;
  dni?: string;
  phone?: string;
  email?: string;
  doctor: string;
  profesional_id?: number;
  specialty: string;
  status: 'confirmed' | 'pending' | 'released' | 'offered' | 'no_show';
  channel: 'SMS' | 'App' | 'Email';
  fecha: string;
  hora: string;
  notas?: string;
}

export interface CreateAppointmentData {
  dni: string;
  nombre_completo: string;
  telefono?: string;
  email?: string;
  profesional_id: number;
  fecha: string;
  hora: string;
  notas?: string;
  es_excepcional?: boolean;
  razon_excepcional?: 'emergencia' | 'caso_especial' | 'extension_horario' | 'otro';
  razon_adicional?: string;
}

export interface RescheduleAppointmentData {
  profesional_id?: number;
  fecha: string;
  hora: string;
  es_excepcional?: boolean;
  razon_excepcional?: 'emergencia' | 'caso_especial' | 'extension_horario' | 'otro';
  razon_adicional?: string;
}

export const appointmentsApi = {
  // Get appointments by date range (for monthly calendar)
  getByDateRange: (fechaInicio: string, fechaFin: string): Promise<Appointment[]> => {
    return api.get<Appointment[]>(`/citas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
  },

  // Get appointments by single date (for backward compatibility)
  getByDate: (fecha: string): Promise<Appointment[]> => {
    return api.get<Appointment[]>(`/citas?fecha=${fecha}`);
  },

  // Search appointments by DNI
  searchByDNI: (dni: string): Promise<Appointment[]> => {
    return api.get<Appointment[]>(`/citas/buscar/${dni}`);
  },

  // Create a new appointment
  create: (data: CreateAppointmentData): Promise<Appointment> => {
    return api.post<Appointment>('/citas', data);
  },

  // Reschedule an appointment
  reschedule: (id: string, data: RescheduleAppointmentData): Promise<Appointment> => {
    return api.put<Appointment>(`/citas/${id}`, data);
  },

  // Confirm an appointment
  confirm: (id: string): Promise<Appointment> => {
    return api.patch<Appointment>(`/citas/${id}/confirmar`, {});
  },

  // Cancel an appointment
  cancel: (id: string): Promise<Appointment> => {
    return api.patch<Appointment>(`/citas/${id}/cancelar`, {});
  },

  // Mark appointment as no-show
  markAsNoShow: (id: string): Promise<Appointment> => {
    return api.patch<Appointment>(`/citas/${id}/no-show`, {});
  },
};

// RENIEC API interface
export interface ReniecData {
  dni: string;
  nombre_completo: string;
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  apellidos?: string;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
  estado_civil?: string | null;
  direccion?: string | null;
  ubigeo?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
}

export interface ReniecResponse {
  success: boolean;
  data: ReniecData;
}

export const reniecApi = {
  // Consultar datos de RENIEC por DNI
  consultarDNI: (dni: string): Promise<ReniecResponse> => {
    return api.get<ReniecResponse>(`/reniec/consultar/${dni}`);
  },
};

// Chatbot API interface
export interface ChatbotMessage {
  mensaje: string;
  opciones?: Array<{ id: string; texto: string }>;
  estado: string;
  finalizado: boolean;
}

export interface ChatbotMessageRequest {
  sessionId: string;
  message: string;
  dni?: string;
  nombre?: string;
  telefono?: string;
}

export const chatbotApi = {
  // Enviar mensaje al chatbot (público, sin autenticación)
  sendMessage: (data: ChatbotMessageRequest): Promise<ChatbotMessage> => {
    return api.post<ChatbotMessage>("/chatbot/message", data, true);
  },
  
  // Obtener especialidades (público, sin autenticación)
  getSpecialties: (): Promise<Array<{ id: number; nombre: string }>> => {
    return api.get<Array<{ id: number; nombre: string }>>("/chatbot/specialties", true);
  },
  
  // Obtener profesionales por especialidad (público, sin autenticación)
  getProfessionals: (specialtyId: number): Promise<Array<{ id: number; nombre_completo: string; consultorio?: string }>> => {
    return api.get<Array<{ id: number; nombre_completo: string; consultorio?: string }>>(`/chatbot/professionals/${specialtyId}`, true);
  },
  
  // Obtener disponibilidad (público, sin autenticación)
  getAvailability: (professionalId: number, fechaInicio?: string): Promise<any> => {
    const params = fechaInicio ? `?fechaInicio=${fechaInicio}` : "";
    return api.get<any>(`/chatbot/availability/${professionalId}${params}`, true);
  },
};

// Configuraciones API interface
export interface Configuraciones {
  reminder_48h_enabled: boolean;
  reminder_24h_enabled: boolean;
  canal_preferido: 'sms' | 'app' | 'ambos';
  auto_offer_enabled: boolean;
  tiempo_max_oferta: number;
  prioridad_adultos_mayores: boolean;
  prioridad_urgentes: boolean;
  prioridad_tiempo_espera: boolean;
  mensaje_confirmacion: string;
  mensaje_oferta_cupo: string;
  chatbot_enabled: boolean;
  chatbot_greeting: string;
  dark_mode_enabled?: boolean;
}

export const configuracionesApi = {
  // Obtener todas las configuraciones
  getConfiguraciones: (): Promise<Configuraciones> => {
    return api.get<Configuraciones>('/configuraciones');
  },
  
  // Actualizar configuraciones
  updateConfiguraciones: (config: Partial<Configuraciones>): Promise<{ message: string; configuraciones: Configuraciones }> => {
    return api.put<{ message: string; configuraciones: Configuraciones }>('/configuraciones', config);
  },
  
  // Restaurar valores por defecto
  restoreDefaults: (): Promise<{ message: string; configuraciones: Configuraciones }> => {
    return api.post<{ message: string; configuraciones: Configuraciones }>('/configuraciones/restore', {});
  },
};

// Sedes API interface
export interface Sede {
  id: number;
  nombre: string;
  codigo: string;
  direccion: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  activa: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CreateSedeData {
  nombre: string;
  codigo: string;
  direccion: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  activa?: boolean;
}

export interface UpdateSedeData extends Partial<CreateSedeData> {}

export const sedesApi = {
  // Obtener todas las sedes activas
  getSedes: (todas?: boolean): Promise<Sede[]> => {
    const params = todas ? '?todas=true' : '';
    return api.get<Sede[]>(`/sedes${params}`);
  },
  
  // Obtener sede por defecto
  getSedePorDefecto: (): Promise<Sede> => {
    return api.get<Sede>('/sedes/por-defecto');
  },
  
  // Obtener una sede por ID
  getSedePorId: (id: number): Promise<Sede> => {
    return api.get<Sede>(`/sedes/${id}`);
  },
  
  // Crear nueva sede (solo admin)
  createSede: (data: CreateSedeData): Promise<Sede> => {
    return api.post<Sede>('/sedes', data);
  },
  
  // Actualizar sede (solo admin)
  updateSede: (id: number, data: UpdateSedeData): Promise<Sede> => {
    return api.put<Sede>(`/sedes/${id}`, data);
  },
  
  // Eliminar sede (solo admin)
  deleteSede: (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/sedes/${id}`);
  },
};

// Notificaciones API interface
export interface Notification {
  id: string;
  tipo: 'confirmacion_pendiente' | 'confirmacion_fallida' | 'oferta_expirando' | 'cita_pendiente';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  accion?: {
    tipo: 'navegar';
    ruta: string;
    params?: Record<string, any>;
  };
}

export interface NotificacionesResponse {
  notificaciones: Notification[];
  total: number;
  noLeidas: number;
}

export const notificacionesApi = {
  // Obtener todas las notificaciones
  getNotificaciones: (): Promise<NotificacionesResponse> => {
    return api.get<NotificacionesResponse>('/notificaciones');
  },
  
  // Marcar notificación como leída
  marcarLeida: (id: string): Promise<{ message: string; id: string }> => {
    return api.patch<{ message: string; id: string }>(`/notificaciones/${id}/leer`, {});
  },
  
  // Marcar todas las notificaciones como leídas
  marcarTodasLeidas: (): Promise<{ message: string }> => {
    return api.patch<{ message: string }>('/notificaciones/leer-todas', {});
  },
};

