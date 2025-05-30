export type UserRole = 'admin' | 'doctor' | 'patient'

export interface User {
  id: number
  email: string
  fullName: string
  role: UserRole
  phone?: string
} 