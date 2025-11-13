const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiError {
  error: string;
  errors?: Array<{ msg: string; param: string }>;
}

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si recibimos un 401, el token es inválido o expiró
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
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
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
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

