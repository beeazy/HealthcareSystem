import { z } from "zod"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

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
  }
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

    // Store token in localStorage
    localStorage.setItem("token", result.token)
    
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
  },

  getToken: () => {
    return localStorage.getItem("token")
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token")
  }
} 