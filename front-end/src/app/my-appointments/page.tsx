'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { appointmentsApi, type Appointment, type Doctor } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface AppointmentWithDoctor extends Omit<Appointment, 'doctor'> {
  doctor?: {
    id: number
    fullName: string
    specialization: string
  }
}

function formatAppointmentDateTime(dateStr: string) {
  const date = new Date(dateStr)
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}

export default function MyAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const data = await appointmentsApi.getPatientAppointments()
      setAppointments(data as AppointmentWithDoctor[])
    } catch (err) {
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date)
    try {
      const slots = await appointmentsApi.getAvailableSlots(date, parseInt(selectedDoctor))
      setAvailableSlots(slots)
    } catch (err) {
      setError('Failed to load available slots')
    }
  }

  const handleBookAppointment = async (time: string) => {
    try {
      await appointmentsApi.createAppointment({
        date: selectedDate,
        time,
        doctorId: parseInt(selectedDoctor),
        notes: '',
      })
      await fetchAppointments()
      setSelectedDate('')
      setSelectedDoctor('')
      setAvailableSlots([])
    } catch (err) {
      setError('Failed to book appointment')
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      await appointmentsApi.cancelAppointment(appointmentId)
      await fetchAppointments()
    } catch (err) {
      setError('Failed to cancel appointment')
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
    <ProtectedRoute allowedRoles={['patient']}>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>

          {/* Book New Appointment Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">Book New Appointment</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Select Date
                </label>
                <input
                  type="date"
                  id="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                  Select Doctor
                </label>
                <select
                  id="doctor"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a doctor</option>
                  {/* We'll need to fetch and populate doctors here */}
                </select>
              </div>
            </div>

            {selectedDate && selectedDoctor && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Available Time Slots</h3>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleBookAppointment(slot.time)}
                      disabled={!slot.available}
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        slot.available
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Existing Appointments Section */}
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
                        Dr. {appointment.doctor?.fullName} - {appointment.doctor?.specialization}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatAppointmentDateTime(appointment.appointmentDate).date} at {formatAppointmentDateTime(appointment.appointmentDate).time}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Past Appointments Section */}
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
                        Dr. {appointment.doctor?.fullName} - {appointment.doctor?.specialization}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatAppointmentDateTime(appointment.appointmentDate).date} at {formatAppointmentDateTime(appointment.appointmentDate).time}
                      </p>
                      <p className="text-sm text-gray-500">Status: {appointment.status}</p>
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