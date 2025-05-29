
export type UserRole = 'admin' | 'doctor' | 'patient'

export interface NavigationItem {
  name: string
  href: string
  roles?: UserRole[]
  icon?: React.ComponentType<{ className?: string }>
}

export const navigationItems: NavigationItem[] = [
  // Common navigation items
  { name: 'Dashboard', href: '/dashboard' },
  
  // Admin navigation items
  { name: 'Doctors', href: '/doctors', roles: ['admin'] },
  { name: 'Patients', href: '/patients', roles: ['admin', 'doctor'] },
  { name: 'Appointments', href: '/appointments', roles: ['admin'] },
  
  // Role-specific navigation items
  { name: 'My Appointments', href: '/doctor-appointments', roles: ['doctor'] },
  { name: 'My Appointments', href: '/my-appointments', roles: ['patient'] },
]

export function getFilteredNavigation(isAdmin: boolean, isDoctor: boolean, isPatient: boolean) {
  return navigationItems.filter(item => {
    if (!item.roles) return true
    return item.roles.some(role => {
      if (role === 'admin') return isAdmin
      if (role === 'doctor') return isDoctor
      if (role === 'patient') return isPatient
      return false
    })
  })
} 