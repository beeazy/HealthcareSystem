"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { Calendar, User, Stethoscope, FileText, LogOut, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { navigationItems, getFilteredNavigation, type UserRole } from "@/lib/navigation"
import { authApi } from "@/lib/api"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: User,
  Appointments: Calendar,
  Doctors: Stethoscope,
  Patients: Users,
  "Medical Records": FileText,
  "My Appointments": Calendar
}

export default function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

  const handleLogout = () => {
    authApi.logout()
    window.location.href = '/auth/login'
  }

  const filteredItems = getFilteredNavigation(user?.role as UserRole, isAuthenticated)

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* if logged in, show dashboard, otherwise show login */}
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Healthcare System
              </Link>
            ) : (
              <Link href="/auth/login" className="text-xl font-bold text-gray-900">
                Healthcare System
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon || iconMap[item.title]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {item.title}
                </Link>
              )
            })}
            {isAuthenticated && (
              <div className="flex items-center space-x-4 ml-4">
                <span className="text-sm text-gray-700">
                  {user?.fullName} ({user?.role})
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 