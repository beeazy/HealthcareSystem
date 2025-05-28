"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { authApi } from "@/lib/api"

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Doctors", href: "/doctors" },
  { name: "Patients", href: "/patients" },
  { name: "Appointments", href: "/appointments" },
  { name: "My Appointments", href: "/my-appointments" },
  { name: "Medical Records", href: "/medical-records" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isAdmin, isDoctor, isPatient } = useAuth()

  const handleLogout = () => {
    authApi.logout()
    window.location.href = '/auth/login'
  }

  const filteredNavigation = navigation.filter(item => {
    if (item.name === "Doctors" || item.name === "Patients") return isAdmin
    if (item.name === "Appointments" || item.name === "Medical Records") return isAdmin || isDoctor
    if (item.name === "My Appointments") return isPatient
    return true
  })

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                Healthcare System
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex items-center space-x-4 ml-4">
                <span className="text-sm text-gray-700">
                  {user?.fullName} ({user?.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
} 