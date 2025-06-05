"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { statsApi } from "@/lib/api"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Layout } from "@/components/Layout"
import { Users, Stethoscope, Calendar, UserCheck, Activity, ClipboardList, PhoneCall, UserPlus } from "lucide-react"
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

type UserRole = 'admin' | 'doctor' | 'patient' | 'receptionist';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType }) => (
  <div className="animate-fade-in rounded-md bg-card ring-1 ring-border p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-card-foreground">{value}</p>
      </div>
      <div className="rounded-md bg-primary/5 p-2 sm:p-3">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const { user, isAdmin, isDoctor, isPatient, isReceptionist } = useAuth()
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
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient', 'receptionist']}>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="scroll-m-20 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-7">Welcome back, {user?.fullName}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isAdmin && (
              <>
                <StatCard
                  title="Total Patients"
                  value={stats?.totalPatients || 0}
                  icon={Users}
                />
                <StatCard
                  title="Total Doctors"
                  value={stats?.totalDoctors || 0}
                  icon={Stethoscope}
                />
              </>
            )}
            {(isAdmin || isDoctor || isReceptionist) && (
              <StatCard
                title="Today's Appointments"
                value={stats?.appointmentsToday || 0}
                icon={Calendar}
              />
            )}
            {(isAdmin || isReceptionist) && (
              <StatCard
                title="Available Doctors"
                value={stats?.availableDoctors || 0}
                icon={UserCheck}
              />
            )}
          </div>

          {isReceptionist && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions Card */}
              <div className="rounded-md bg-card ring-1 ring-border p-6">
                <h3 className="scroll-m-20 text-lg font-semibold tracking-tight text-card-foreground mb-4">Quick Actions</h3>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => router.push('/appointments')}
                      className="group relative flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 ring-1 ring-border hover:ring-primary hover:shadow-sm transition-all duration-200"
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <Calendar className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="relative text-sm font-medium text-foreground group-hover:text-primary transition-colors">Book Appointment</span>
                    </button>
                    <button 
                      onClick={() => router.push('/patients')}
                      className="group relative flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 ring-1 ring-border hover:ring-primary hover:shadow-sm transition-all duration-200"
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-secondary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <UserPlus className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="relative text-sm font-medium text-foreground group-hover:text-primary transition-colors">New Patient</span>
                    </button>
                    <button 
                      onClick={() => router.push('/appointments')}
                      className="group relative flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 ring-1 ring-border hover:ring-primary hover:shadow-sm transition-all duration-200"
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-accent/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <ClipboardList className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="relative text-sm font-medium text-foreground group-hover:text-primary transition-colors">View Schedule</span>
                    </button>
                    <button 
                      onClick={() => router.push('/patients')}
                      className="group relative flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 ring-1 ring-border hover:ring-primary hover:shadow-sm transition-all duration-200"
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-muted/20 to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <Users className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="relative text-sm font-medium text-foreground group-hover:text-primary transition-colors">Manage Patients</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Tasks Card */}
              <div className="rounded-md bg-card ring-1 ring-border p-6">
                <h3 className="scroll-m-20 text-lg font-semibold tracking-tight text-card-foreground mb-4">Today's Tasks</h3>
                <div className="space-y-4">
                  <div className="group flex items-center justify-between rounded-md bg-background p-3 text-sm ring-1 ring-border hover:bg-accent/5 hover:text-accent-foreground transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
                      <div>
                        <p className="font-medium leading-none">Confirm Tomorrow's Appointments</p>
                        <p className="text-xs text-muted-foreground pt-1">Call patients to confirm their visits</p>
                      </div>
                    </div>
                    <PhoneCall className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                  </div>
                  <div className="group flex items-center justify-between rounded-md bg-background p-3 text-sm ring-1 ring-border hover:bg-accent/5 hover:text-accent-foreground transition-colors">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
                      <div>
                        <p className="font-medium leading-none">Update Patient Records</p>
                        <p className="text-xs text-muted-foreground pt-1">Verify insurance information</p>
                      </div>
                    </div>
                    <UserCheck className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="rounded-md bg-card ring-1 ring-border p-6">
              <h3 className="scroll-m-20 text-lg font-semibold tracking-tight text-card-foreground">Top Specializations</h3>
              <div className="mt-4 space-y-3">
                {stats?.topSpecializations.map((spec, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground leading-none">{spec}</span>
                    <div className="h-2 w-24 rounded-full bg-secondary/10">
                      <div
                        className="h-2 rounded-full bg-primary/90 transition-all duration-500 ease-in-out"
                        style={{ width: `${100 - index * 15}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(isAdmin || isDoctor || isReceptionist) && (
            <div className="animate-fade-in-delay-2 rounded-xl bg-card p-6 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground">Appointments by Month</h3>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-6">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fill: 'var(--muted-foreground)' }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                      contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--popover-foreground)'
                      }}
                    />
                    <Bar 
                      dataKey="appointments" 
                      fill="var(--primary)" 
                      radius={8}
                      activeBar={{ fill: 'var(--accent)' }}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}

          {isPatient && (
            <div className="rounded-md bg-card p-6 shadow-sm ring-1 ring-border">
              <h3 className="scroll-m-20 text-lg font-semibold tracking-tight text-card-foreground">Welcome, {user?.fullName}</h3>
              <p className="text-sm text-muted-foreground leading-7 [&:not(:first-child)]:mt-2">
                You can manage your appointments and view your medical records from here.
              </p>
              <div className="mt-4">
                <button 
                  onClick={() => router.push('/my-appointments')}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
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