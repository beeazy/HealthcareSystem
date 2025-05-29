'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { appointmentsApi, type Appointment } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { format, parseISO, isSameDay } from 'date-fns'
import { toast } from 'sonner'
import { CalendarIcon } from 'lucide-react'

interface AppointmentWithPatient extends Omit<Appointment, 'patient'> {
  patientId: number
  doctorId: number
  startTime: string
  endTime: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function DoctorAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const data = await appointmentsApi.getDoctorAppointments()
      console.log('Fetched appointments:', data) // Debug log
      setAppointments(data)
    } catch (err) {
      console.error('Error fetching appointments:', err) // Debug log
      setError('Failed to load appointments')
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId: number, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      if (newStatus === 'cancelled') {
        await appointmentsApi.cancelAppointment(appointmentId)
        toast.success('Appointment cancelled successfully')
      } else if (newStatus === 'completed') {
        const appointment = appointments.find(apt => apt.id === appointmentId)
        if (appointment) {
          await appointmentsApi.updateAppointment(appointmentId, {
            status: 'completed'
          })
          toast.success('Appointment marked as completed')
        }
      }
      await fetchAppointments()
    } catch (err) {
      console.error('Error updating appointment:', err) // Debug log
      setError('Failed to update appointment status')
      toast.error('Failed to update appointment status')
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString)
    return format(date, 'MMM d, yyyy h:mm a')
  }

  const filteredAppointments = selectedDate
    ? appointments.filter(apt => {
        const appointmentDate = parseISO(apt.startTime)
        const filterDate = parseISO(selectedDate)
        return isSameDay(appointmentDate, filterDate)
      })
    : appointments

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="space-y-4 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Appointments</h1>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setSelectedDate('')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    !selectedDate
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Appointments
                </button>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm shadow-sm transition-colors hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {filteredAppointments
                    .filter((apt) => apt.status === 'scheduled')
                    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-gray-100 p-4 hover:border-indigo-100 transition-colors duration-200"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">
                            Patient ID: {appointment.patientId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(appointment.startTime)}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500 italic">Notes: {appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                            className="flex-1 sm:flex-none rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-100 transition-colors duration-200"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            className="flex-1 sm:flex-none rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  {filteredAppointments.filter((apt) => apt.status === 'scheduled').length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {selectedDate ? 'No upcoming appointments for this date' : 'No upcoming appointments'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Past Appointments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Past Appointments</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {filteredAppointments
                    .filter((apt) => apt.status !== 'scheduled')
                    .sort((a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition-colors duration-200"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">
                            Patient ID: {appointment.patientId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(appointment.startTime)}
                          </p>
                          <p className="text-sm font-medium">
                            Status: <span className={`${
                              appointment.status === 'completed' ? 'text-green-600' :
                              appointment.status === 'cancelled' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>{appointment.status}</span>
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500 italic">Notes: {appointment.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  {filteredAppointments.filter((apt) => apt.status !== 'scheduled').length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {selectedDate ? 'No past appointments for this date' : 'No past appointments'}
                    </p>
                  )}
                </div>
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
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 