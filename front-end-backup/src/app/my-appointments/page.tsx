'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { appointmentsApi, type Appointment } from '@/lib/api'
import { doctorsApi, type Doctor as ApiDoctor } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import { z } from 'zod'
import { addMinutes, isAfter, isBefore, parseISO } from 'date-fns'

interface Doctor {
    id: number
    fullName: string
    specialization: string
  }

interface AppointmentWithDoctor extends Omit<Appointment, 'doctor'> {
  doctor?: Doctor
}

const appointmentSchema = z.object({
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  doctorId: z.number().positive('Please select a doctor'),
  notes: z.string().optional(),
})

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
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])

  useEffect(() => {
    fetchAppointments()
    fetchDoctors()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const data = await appointmentsApi.getPatientAppointments()
      setAppointments(data as AppointmentWithDoctor[])
    } catch (err) {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const data = await doctorsApi.getDoctors()
      setDoctors(data.map((doctor: ApiDoctor) => ({
        id: doctor.id,
        fullName: doctor.fullName,
        specialization: doctor.doctorProfile.specialization
      })))
    } catch (err) {
      toast.error('Failed to load doctors')
    }
  }

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date)
    if (!selectedDoctor) {
      toast.error('Please select a doctor first')
      return
    }
    try {
      const slots = await appointmentsApi.getAvailableSlots(date, parseInt(selectedDoctor))
      setAvailableSlots(slots)
    } catch (err) {
      toast.error('Failed to load available slots')
    }
  }

  const validateAppointmentTime = (date: string, time: string, doctorId: number): boolean => {
    const appointmentDateTime = parseISO(`${date}T${time}`)
    const appointmentEndTime = addMinutes(appointmentDateTime, 30)

    // Check if appointment is in the past
    if (isBefore(appointmentDateTime, new Date())) {
      toast.error('Cannot book appointments in the past')
      return false
    }

    // Check if appointment is within business hours (9 AM - 5 PM)
    const hours = appointmentDateTime.getHours()
    if (hours < 9 || hours >= 17) {
      toast.error('Appointments are only available between 9 AM and 5 PM')
      return false
    }

    // Check for overlapping appointments
    const hasOverlap = appointments.some(appointment => {
      if (appointment.doctorId !== doctorId || appointment.status === 'cancelled') return false
      
      const existingStart = parseISO(appointment.appointmentDate)
      const existingEnd = addMinutes(existingStart, 30)
      
      return (
        (isAfter(appointmentDateTime, existingStart) && isBefore(appointmentDateTime, existingEnd)) ||
        (isAfter(appointmentEndTime, existingStart) && isBefore(appointmentEndTime, existingEnd))
      )
    })

    if (hasOverlap) {
      toast.error('This time slot overlaps with an existing appointment')
      return false
    }

    return true
  }

  const handleBookAppointment = async (time: string) => {
    console.log("handleBookAppointment called with time:", time)
    try {
      console.log("Starting try block")
      setBookingLoading(true)
      
      // Combine date and time into ISO format
      const appointmentDate = `${selectedDate}T${time}:00`
      console.log("Generated appointmentDate:", appointmentDate)
      
      // Match backend schema exactly
      const data = {
        patientId: user?.id || 0,
        doctorId: parseInt(selectedDoctor),
        appointmentDate,
        notes: ''
      }

      console.log("data as at here", JSON.stringify(data))
      console.log("user?.id:", user?.id)
      console.log("selectedDoctor:", selectedDoctor)

      // Validate appointment time
      if (!validateAppointmentTime(selectedDate, time, parseInt(selectedDoctor))) {
        console.log("Appointment time validation failed")
        return
      }
      console.log("Appointment time validation passed")

      // Optimistic update
      const optimisticAppointment: AppointmentWithDoctor = {
        id: Date.now(), // Temporary ID
        patientId: user?.id || 0,
        doctorId: parseInt(selectedDoctor),
        appointmentDate,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctor: doctors.find(d => d.id === parseInt(selectedDoctor)),
      }

      setAppointments(prev => [optimisticAppointment, ...prev])

      // Make API call
      console.log("Making API call to create appointment")
      const response = await appointmentsApi.createAppointment(data)
      console.log("API response:", response)
      toast.success('Appointment booked successfully')
      
      // Reset form
      setSelectedDate('')
      setSelectedDoctor('')
      setAvailableSlots([])
      
      // Refresh appointments
      await fetchAppointments()
    } catch (err) {
      console.error("Error in handleBookAppointment:", err)
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to book appointment')
      }
      // Refresh appointments to ensure consistency
      await fetchAppointments()
    } finally {
      setBookingLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      // Optimistic update
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      )

      await appointmentsApi.cancelAppointment(appointmentId)
      toast.success('Appointment cancelled successfully')
    } catch (err) {
      toast.error('Failed to cancel appointment')
      // Refresh appointments to ensure consistency
      await fetchAppointments()
    }
  }

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
    <ProtectedRoute allowedRoles={['patient']}>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>

          {/* Book New Appointment Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">Book New Appointment</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.fullName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>

            {selectedDate && selectedDoctor && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Available Time Slots</h3>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleBookAppointment(slot.time)}
                      disabled={!slot.available || bookingLoading}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        slot.available
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300'
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
                      disabled={bookingLoading}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:bg-red-300"
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
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 