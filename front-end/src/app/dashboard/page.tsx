"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { statsApi } from "@/lib/api"
import { ProtectedRoute } from "@/components/ProtectedRoute"

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

export default function Dashboard() {
  const { user, isAdmin, isDoctor, isPatient } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Total Patients</h3>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.totalPatients}</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Total Doctors</h3>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.totalDoctors}</p>
              </div>
            </>
          )}
          {(isAdmin || isDoctor) && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.appointmentsToday}</p>
            </div>
          )}
          {isAdmin && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">Available Doctors</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.availableDoctors}</p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Top Specializations</h3>
            <div className="mt-4 space-y-2">
              {stats?.topSpecializations.map((spec, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600">{spec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(isAdmin || isDoctor) && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Appointments by Month</h3>
            <div className="mt-4">
              <div className="flex items-end space-x-2">
                {stats?.appointmentsByMonth.counts.map((count, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-blue-500"
                    style={{ height: `${(count / Math.max(...stats.appointmentsByMonth.counts)) * 100}px` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-600">
                {stats?.appointmentsByMonth.months.map((month, index) => (
                  <span key={index}>{month}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {isPatient && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Welcome, {user?.fullName}</h3>
            <p className="mt-2 text-gray-600">
              You can manage your appointments and view your medical records from here.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 