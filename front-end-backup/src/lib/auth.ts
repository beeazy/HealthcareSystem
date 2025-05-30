'use client'

import React, { ComponentType } from 'react'
import { authApi } from './api'
import { AuthError } from '@/components/AuthError'
import { create } from 'zustand'
import { User } from './types'

export type UserRole = 'admin' | 'doctor' | 'patient'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isDoctor: boolean
  isPatient: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  canAccess: (roles: string[]) => boolean
}

type AuthStore = {
  set: (state: Partial<AuthState>) => void
  get: () => AuthState
}

export const useAuth = create<AuthState>((set: AuthStore['set'], get: AuthStore['get']) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isDoctor: false,
  isPatient: false,

  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      set({
        user: response.user,
        isAuthenticated: true,
        isAdmin: response.user.role === 'admin',
        isDoctor: response.user.role === 'doctor',
        isPatient: response.user.role === 'patient',
      })
    } catch (error) {
      throw error
    }
  },

  logout: () => {
    authApi.logout()
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isDoctor: false,
      isPatient: false,
    })
  },

  canAccess: (roles: string[]) => {
    const { user } = get()
    return user ? roles.includes(user.role) : false
  },
}))

// Initialize auth state from localStorage on client side
if (typeof window !== 'undefined') {
  const user = authApi.getUser()
  if (user) {
    useAuth.setState({
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
      isDoctor: user.role === 'doctor',
      isPatient: user.role === 'patient',
    })
  }
}

export const withAuth = (allowedRoles: UserRole[]) => {
  return (Component: ComponentType<any>) => {
    return function WithAuth(props: any) {
      const { isAuthenticated, canAccess } = useAuth()

    if (!isAuthenticated) {
        return React.createElement(AuthError, {
          title: "Authentication Required",
          message: "Please log in to access this page.",
          action: { text: "Go to Login", href: "/auth/login" }
        })
      }

      if (!canAccess(allowedRoles)) {
        return React.createElement(AuthError, {
          title: "Access Denied",
          message: "You do not have permission to access this page.",
          action: { text: "Go to Dashboard", href: "/dashboard" }
        })
      }

      return React.createElement(Component, props)
    }
  }
} 