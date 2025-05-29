'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { appointmentsApi, type Appointment } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { format } from 'date-fns'

interface AppointmentWithPatient extends Omit<Appointment, 'patient'> {
  patient?: {
    id: number
    fullName: string
  }
}

export default function DoctorAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  const fetchAppointments = async () => {
    try {
      const data = await appointmentsApi.getDoctorAppointments()
      setAppointments(data as AppointmentWithPatient[])
    } catch (err) {
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId: number, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      if (newStatus === 'cancelled') {
        await appointmentsApi.cancelAppointment(appointmentId)
      } else {
        const appointment = appointments.find(apt => apt.id === appointmentId)
        if (appointment) {
          await appointmentsApi.createAppointment({
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            appointmentDate: appointment.appointmentDate,
            notes: appointment.notes
          })
        }
      }
      await fetchAppointments()
    } catch (err) {
      setError('Failed to update appointment status')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Upcoming Appointments */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
            <div className="mt-4 space-y-4">
              {appointments
                .filter((apt) => apt.status === 'scheduled')
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Patient: {appointment.patient?.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.appointmentDate}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500">Notes: {appointment.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(appointment.id, 'completed')}
                        className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Past Appointments */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">Past Appointments</h2>
            <div className="mt-4 space-y-4">
              {appointments
                .filter((apt) => apt.status !== 'scheduled')
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Patient: {appointment.patient?.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.appointmentDate}
                      </p>
                      <p className="text-sm text-gray-500">Status: {appointment.status}</p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500">Notes: {appointment.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 