"use client"

import Navigation from "@/components/Navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="py-1">
        {children}
      </main>
    </div>
  )
} 