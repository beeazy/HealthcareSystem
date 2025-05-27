import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Healthcare System Dashboard",
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="font-semibold mb-2">Patients</h2>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="font-semibold mb-2">Appointments</h2>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="font-semibold mb-2">Staff</h2>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
} 