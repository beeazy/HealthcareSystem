"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { Calendar, User, Stethoscope, FileText, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: User,
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    roles: ["admin", "doctor", "patient"],
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
    roles: ["admin", "patient"],
  },
  {
    title: "Medical Records",
    href: "/medical-records",
    icon: FileText,
    roles: ["admin", "doctor", "patient"],
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const filteredItems = navigationItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  )

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Healthcare System
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.title}
                </Link>
              )
            })}
            <div className="flex items-center space-x-4 ml-4">
              <span className="text-sm text-gray-700">
                {user?.fullName} ({user?.role})
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => logout()}
                className="flex items-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 