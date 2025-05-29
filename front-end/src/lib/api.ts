import { z } from "zod"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Request failed")
    }

    return response.json()
  },

  post: async <T>(endpoint: string, data: any): Promise<T> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Request failed")
    }

    return response.json()
  },

  patch: async <T>(endpoint: string, data: any): Promise<T> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Request failed")
    }

    return response.json()
  },
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().max(20).optional(),
})

export const patientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().length(10), // Format: YYYY-MM-DD
  gender: z.string().min(2).max(10),
  insuranceProvider: z.string().min(2).max(100).optional(),
  insuranceNumber: z.string().min(2).max(50).optional(),
}).strict()

export const doctorSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  specialization: z.string().min(2).max(100),
  licenseNumber: z.string().min(5).max(50),
}).strict()

export const appointmentSchema = z.object({
  patientId: z.number().int().positive("Please select a patient"),
  doctorId: z.number().int().positive("Please select a doctor"),
  startTime: z.string()
    .transform(str => new Date(str))
    .refine(date => date > new Date(), {
      message: "Appointment date must be in the future"
    })
    .refine(date => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      // Only allow appointments between 9 AM and 5 PM
      return (hours > 9 || (hours === 9 && minutes >= 0)) && 
             (hours < 17 || (hours === 17 && minutes === 0));
    }, {
      message: "Appointments are only available between 9 AM and 5 PM"
    }),
  notes: z.string().optional(),
}).strict()

export const medicalRecordSchema = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.number().int().positive(),
  diagnosis: z.string().min(1),
  prescription: z.string().optional(),
  notes: z.string().optional(),
}).strict()

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PatientInput = z.infer<typeof patientSchema>
export type DoctorInput = z.infer<typeof doctorSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>

interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    fullName: string
    role: 'admin' | 'doctor' | 'patient'
    phone?: string
  }
}

interface StatsResponse {
  totalPatients: number
  totalDoctors: number
  appointmentsToday: number
  availableDoctors: number
  topSpecializations: string[]
  appointmentsByMonth: {
    months: string[]
    counts: number[]
  }
}

export interface Patient {
  id: number
  email: string
  fullName: string
  role: 'patient'
  phone?: string
  patientProfile: {
    dateOfBirth: string
    gender: string
    insuranceProvider?: string
    insuranceNumber?: string
  }
  createdAt: string
  updatedAt: string
}

export interface Doctor {
  id: number
  fullName: string
  email: string
  phone?: string
  role: 'doctor'
  doctorProfile: {
    specialization: string
    licenseNumber: string
    isActive: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: number
  patientId: number
  doctorId: number
  startTime: string
  status: 'scheduled' | 'cancelled' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
  patient?: Patient
  doctor?: Doctor
}

export interface MedicalRecord {
  id: number
  patientId: number
  doctorId: number
  diagnosis: string
  prescription?: string
  notes?: string
  createdAt: string
  updatedAt: string
  patient?: Patient
  doctor?: Doctor
}

const isBrowser = typeof window !== 'undefined';

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      const error: ApiError = result
      if (response.status === 401) {
        throw new Error("Invalid email or password")
      }
      throw new Error(error.message || "Login failed")
    }

    // Store token and user data in localStorage only on client side
    if (isBrowser) {
      localStorage.setItem("token", result.token)
      localStorage.setItem("user", JSON.stringify(result.user))
    }
    
    return result
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      const error: ApiError = result
      if (response.status === 409) {
        throw new Error("Email already exists")
      }
      throw new Error(error.message || "Registration failed")
    }

    return result
  },

  logout: () => {
    if (isBrowser) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },

  getToken: () => {
    return isBrowser ? localStorage.getItem("token") : null
  },

  isAuthenticated: () => {
    return isBrowser ? !!localStorage.getItem("token") : false
  },

  getUser: () => {
    if (!isBrowser) return null;
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  },

  isAdmin: () => {
    const user = authApi.getUser()
    return user?.role === 'admin'
  }
}

export const statsApi = {
  getStats: async (): Promise<StatsResponse> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch stats")
    }

    return response.json()
  }
}

export const patientsApi = {
  getPatients: async (): Promise<Patient[]> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/patients`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch patients")
    }

    return response.json()
  },

  addPatient: async (data: PatientInput): Promise<Patient> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to add patient")
    }

    return response.json()
  },

  updatePatient: async (id: number, data: Partial<PatientInput>): Promise<Patient> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/patients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to update patient")
    }

    return response.json()
  },

  deletePatient: async (id: number): Promise<void> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/patients/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to delete patient")
    }
  }
}

const getAuthHeaders = () => {
  const token = authApi.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const appointmentsApi = {
  getAppointments: () => 
    fetch(`${API_URL}/appointments`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()),
  
  getPatientAppointments: async () => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    console.log('Fetching patient appointments with token:', token.substring(0, 10) + '...')

    const response = await fetch(`${API_URL}/appointments/patient`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.message || "Failed to fetch patient appointments")
    }

    const data = await response.json()
    return data
  },
  
  getDoctorAppointments: () => 
    fetch(`${API_URL}/appointments/doctor`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()),
  
  getAvailableSlots: (date: string, doctorId: number) => 
    fetch(`${API_URL}/appointments/slots?date=${date}&doctorId=${doctorId}`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()),
  
  createAppointment: async (data: {
    patientId: number
    doctorId: number
    startTime: string
    notes?: string
  }) => {
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to create appointment")
    }

    return response.json()
  },

  updateAppointment: async (id: number, data: { status: 'scheduled' | 'completed' | 'cancelled' }) => {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to update appointment")
    }

    return response.json()
  },

  cancelAppointment: (id: number) => 
    fetch(`${API_URL}/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(res => res.json()),
};

export const doctorsApi = {
  getDoctors: () => 
    fetch(`${API_URL}/doctors`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()),
  
  addDoctor: (data: DoctorInput) => 
    fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json()),
  
  updateDoctor: (id: number, data: Partial<DoctorInput>) => 
    fetch(`${API_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json()),
  
  deactivateDoctor: (id: number) => 
    fetch(`${API_URL}/doctors/${id}/deactivate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(res => res.json()),

  deleteDoctor: (id: number) => 
    fetch(`${API_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(res => res.json()),
};

export const medicalRecordsApi = {
  getMedicalRecords: async (patientId: number): Promise<MedicalRecord[]> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/records/patients/${patientId}/records`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch medical records")
    }

    return response.json()
  },

  addMedicalRecord: async (data: MedicalRecordInput): Promise<MedicalRecord> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to add medical record")
    }

    return response.json()
  },

  getMedicalRecord: async (id: number): Promise<MedicalRecord> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/records/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch medical record")
    }

    return response.json()
  }
} 