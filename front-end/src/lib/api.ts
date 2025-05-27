import { z } from "zod"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})

export const patientSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  dateOfBirth: z.string(),
  gender: z.string().min(2, "Gender is required").max(10),
  contactInfo: z.string().min(2, "Contact info is required").max(255),
  insuranceProvider: z.string().max(100).optional(),
  insuranceNumber: z.string().max(50).optional(),
})

export const doctorSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().max(20).optional(),
  specialization: z.string().min(2, "Specialization is required").max(100),
  licenseNumber: z.string().min(5, "License number must be at least 5 characters").max(50),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict()

export const appointmentSchema = z.object({
  patientId: z.number().int().positive("Please select a patient"),
  doctorId: z.number().int().positive("Please select a doctor"),
  appointmentDate: z.string().refine((str) => {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }, "Invalid date format"),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'cancelled', 'completed']),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PatientInput = z.infer<typeof patientSchema>
export type DoctorInput = z.infer<typeof doctorSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>

interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'admin' | 'doctor' | 'patient'
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
  fullName: string
  dateOfBirth: string
  gender: string
  contactInfo: string
  insuranceProvider?: string
  insuranceNumber?: string
  createdAt: string
  updatedAt: string
}

export interface Doctor {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  specialization: string
  licenseNumber: string
  isAvailable?: boolean
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: number
  patientId: number
  doctorId: number
  appointmentDate: string
  status: 'scheduled' | 'cancelled' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
  patient?: Patient
  doctor?: Doctor
}

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

    // Store token and user data in localStorage
    localStorage.setItem("token", result.token)
    localStorage.setItem("user", JSON.stringify(result.user))
    
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
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },

  getToken: () => {
    return localStorage.getItem("token")
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token")
  },

  getUser: () => {
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

export const doctorsApi = {
  getDoctors: async (): Promise<Doctor[]> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/doctors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch doctors")
    }

    return response.json()
  },

  addDoctor: async (data: DoctorInput): Promise<Doctor> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/doctors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to add doctor")
    }

    return response.json()
  },

  updateDoctor: async (id: number, data: Partial<DoctorInput>): Promise<Doctor> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/doctors/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to update doctor")
    }

    return response.json()
  },

  deleteDoctor: async (id: number): Promise<void> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/doctors/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to delete doctor")
    }
  }
}

export const appointmentsApi = {
  getAppointments: async (doctorId?: number, date?: string): Promise<Appointment[]> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const queryParams = new URLSearchParams()
    if (doctorId) queryParams.append('doctorId', doctorId.toString())
    if (date) queryParams.append('date', date)

    const response = await fetch(`${API_URL}/appointments?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch appointments")
    }

    return response.json()
  },

  scheduleAppointment: async (data: AppointmentInput): Promise<Appointment> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to schedule appointment")
    }

    return response.json()
  },

  updateAppointmentStatus: async (id: number, status: 'scheduled' | 'cancelled' | 'completed'): Promise<Appointment> => {
    const token = authApi.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/appointments/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || "Failed to update appointment status")
    }

    return response.json()
  },
} 