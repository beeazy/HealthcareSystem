export type UserRole = 'admin' | 'doctor' | 'patient'

export interface NavigationItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  requiresAuth: boolean
}

export const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    roles: ['admin', 'doctor', 'patient'],
    requiresAuth: true
  },
  {
    title: 'Doctors',
    href: '/doctors',
    roles: ['admin', 'patient'],
    requiresAuth: true
  },
  {
    title: 'Patients',
    href: '/patients',
    roles: ['admin', 'doctor'],
    requiresAuth: true
  },
  {
    title: 'Appointments',
    href: '/appointments',
    roles: ['admin'],
    requiresAuth: true
  },
  {
    title: 'My Appointments',
    href: '/doctor-appointments',
    roles: ['doctor'],
    requiresAuth: true
  },
  {
    title: 'My Appointments',
    href: '/my-appointments',
    roles: ['patient'],
    requiresAuth: true
  },
  {
    title: 'Medical Records',
    href: '/medical-records',
    roles: ['admin', 'doctor', 'patient'],
    requiresAuth: true
  }
]

export function getFilteredNavigation(userRole?: UserRole, isAuthenticated: boolean = false) {
  if (!isAuthenticated) return []
  
  return navigationItems.filter(item => {
    if (!item.requiresAuth) return true
    return item.roles.includes(userRole as UserRole)
  })
} 