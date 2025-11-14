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
  status: 'confirmed' | 'pending' | 'released' | 'offered';
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

