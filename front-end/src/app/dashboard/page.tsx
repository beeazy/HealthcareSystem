"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { statsApi } from "@/lib/api"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Layout } from "@/components/Layout"
import { Users, Stethoscope, Calendar, UserCheck, Activity } from "lucide-react"
import { Loading } from "@/components/ui/loading"
import { useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Stats {
  totalPatients: number
  totalDoctors: number
  appointmentsToday: number
  availableDoctors: number
  topSpecializations: string[]
  appointmentsByMonth: {
    months: string[]
    counts: number[]
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
  <div className="animate-fade-in rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`rounded-full p-3 bg-primary`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const { user, isAdmin, isDoctor, isPatient } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getStats()
        setStats(data)
      } catch (err) {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getAppointmentData = () => {
    if (!stats?.appointmentsByMonth) {
      return { counts: Array(12).fill(0), months: MONTHS }
    }

    const monthData = new Map(MONTHS.map(month => [month, 0]))
    
    stats.appointmentsByMonth.months.forEach((month, index) => {
      monthData.set(month, stats.appointmentsByMonth.counts[index])
    })

    return {
      counts: Array.from(monthData.values()),
      months: Array.from(monthData.keys())
    }
  }

  const appointmentData = getAppointmentData()
  const chartData = appointmentData.months.map((month, index) => ({
    month,
    appointments: appointmentData.counts[index]
  }))

  const chartConfig = {
    appointments: {
      label: "Appointments",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  if (loading) {
    return (
      <Layout>
        <Loading message="Loading dashboard data..." />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']}>
      <Layout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.fullName}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isAdmin && (
              <>
                <StatCard
                  title="Total Patients"
                  value={stats?.totalPatients || 0}
                  icon={Users}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Total Doctors"
                  value={stats?.totalDoctors || 0}
                  icon={Stethoscope}
                  color="bg-green-500"
                />
              </>
            )}
            {(isAdmin || isDoctor) && (
              <StatCard
                title="Today's Appointments"
                value={stats?.appointmentsToday || 0}
                icon={Calendar}
                color="bg-purple-500"
              />
            )}
            {isAdmin && (
              <StatCard
                title="Available Doctors"
                value={stats?.availableDoctors || 0}
                icon={UserCheck}
                color="bg-indigo-500"
              />
            )}
          </div>

          {isAdmin && (
            <div className="animate-fade-in-delay rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Top Specializations</h3>
              <div className="mt-4 space-y-3">
                {stats?.topSpecializations.map((spec, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{spec}</span>
                    <div className="h-2 w-24 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${100 - index * 15}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(isAdmin || isDoctor) && (
            <div className="animate-fade-in-delay-2 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Appointments by Month</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div className="mt-6">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="appointments" fill="var(--color-appointments)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}

          {isPatient && (
            <div className="animate-fade-in-delay rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Welcome, {user?.fullName}</h3>
              <p className="mt-2 text-gray-600">
                You can manage your appointments and view your medical records from here.
              </p>
              <div className="mt-4">
                <button 
                  onClick={() => router.push('/my-appointments')}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                >
                  Schedule Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}