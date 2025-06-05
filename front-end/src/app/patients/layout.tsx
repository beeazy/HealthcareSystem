import DashboardLayout from "@/app/dashboard/layout"
import { Layout } from "@/components/Layout"
import Navigation from "@/components/Navigation"

export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Layout>
        {children}
      </Layout>
    </div>
  )
} 