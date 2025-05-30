"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { Calendar, User, Stethoscope, FileText, LogOut, Users, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFilteredNavigation, type UserRole } from "@/lib/navigation"
import { authApi } from "@/lib/api"
import { useState } from "react"

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    authApi.logout()
    window.location.href = '/auth/login'
  }

  const filteredItems = getFilteredNavigation(user?.role as UserRole, isAuthenticated)

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {isAuthenticated ? (
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Stethoscope className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-gray-900">Healthcare System</span>
              </Link>
            ) : (
              <Link href="/auth/login" className="flex items-center space-x-2">
                <Stethoscope className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-gray-900">Healthcare System</span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon || iconMap[item.title]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 hover:text-primary"
                  )}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {item.title}
                </Link>
              )
            })}
            {isAuthenticated && (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l">
                <span className="text-sm font-medium text-gray-700">
                  {user?.fullName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon || iconMap[item.title]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-base font-medium",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {Icon && <Icon className="mr-3 h-5 w-5" />}
                  {item.title}
                </Link>
              )
            })}
            {isAuthenticated && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.fullName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 