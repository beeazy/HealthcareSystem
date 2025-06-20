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
import { Loading } from "@/components/ui/loading"
import Navigation from '@/components/Navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Doctor {
    id: number
    fullName: string
    doctorProfile: {
      specialization: string
    }
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
  const [notes, setNotes] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedTime, setSelectedTime] = useState('')

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
      setDoctors(data
        .filter((doctor: ApiDoctor) => doctor.doctorProfile.isActive)
        .map((doctor: ApiDoctor) => ({
          id: doctor.id,
          fullName: doctor.fullName,
          doctorProfile: {
            specialization: doctor.doctorProfile.specialization
          }
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
      
      const existingStart = parseISO(appointment.startTime)
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

  const handleTimeSelect = (time: string) => {
    // Ensure time is in HH:MM format with leading zeros
    const [hours, minutes] = time.split(':')
    const formattedTime = `${hours.padStart(2, '0')}:${minutes}`
    setSelectedTime(formattedTime)
    setShowConfirmDialog(true)
  }

  const handleConfirmBooking = async () => {
    try {
      setBookingLoading(true)
      
      // Ensure time is in HH:MM format with leading zeros
      const [hours, minutes] = selectedTime.split(':')
      const formattedTime = `${hours.padStart(2, '0')}:${minutes}`
      const appointmentDate = `${selectedDate}T${formattedTime}:00`
      
      const data = {
        patientId: user?.id || 0,
        doctorId: parseInt(selectedDoctor),
        startTime: appointmentDate,
        notes: notes
      }

      // Validate appointment time
      if (!validateAppointmentTime(selectedDate, formattedTime, parseInt(selectedDoctor))) {
        return
      }

      // Optimistic update
      const optimisticAppointment: AppointmentWithDoctor = {
        id: Date.now(),
        patientId: user?.id || 0,
        doctorId: parseInt(selectedDoctor),
        startTime: appointmentDate,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctor: doctors.find(d => d.id === parseInt(selectedDoctor)),
      }

      setAppointments(prev => [optimisticAppointment, ...prev])

      await appointmentsApi.createAppointment(data)
      toast.success('Appointment booked successfully')
      
      // Reset form
      setSelectedDate('')
      setSelectedDoctor('')
      setAvailableSlots([])
      setNotes('')
      setShowConfirmDialog(false)
      
      // Refresh appointments
      await fetchAppointments()
    } catch (err) {
      console.error("Error in handleConfirmBooking:", err)
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to book appointment')
      }
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
        <Loading message="Loading your appointments..." />
      </Layout>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <Navigation />
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
            </div>

            {/* Book New Appointment Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="text-xl font-semibold text-card-foreground">Book New Appointment</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Doctor
                    </label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            {doctor.fullName} - {doctor.doctorProfile.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Date
                    </label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => handleDateSelect(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-medium">
                      Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add any additional notes for your appointment"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {selectedDate && selectedDoctor && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Available Time Slots</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          onClick={() => handleTimeSelect(slot.time)}
                          disabled={!slot.available || bookingLoading}
                          variant={slot.available ? "default" : "outline"}
                          className={cn(
                            "w-full",
                            !slot.available && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You are booking an appointment for {selectedDate} at {selectedTime}
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add any additional notes for your appointment"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmBooking}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Upcoming Appointments Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="text-xl font-semibold text-card-foreground">Upcoming Appointments</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {appointments
                    .filter((apt) => apt.status === 'scheduled')
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors duration-200"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-card-foreground">
                            {appointment.doctor?.fullName} - {appointment.doctor?.doctorProfile?.specialization}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.startTime).toLocaleString()}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground italic">Notes: {appointment.notes}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={bookingLoading}
                          variant="outline"
                          className="text-destructive border-destructive/20 bg-destructive/10 hover:bg-destructive/20 hover:text-destructive"
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  {appointments.filter((apt) => apt.status === 'scheduled').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming appointments</p>
                  )}
                </div>
              </div>
            </div>

            {/* Past Appointments Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="text-xl font-semibold text-card-foreground">Past Appointments</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {appointments
                    .filter((apt) => apt.status !== 'scheduled')
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors duration-200"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-card-foreground">
                            {appointment.doctor?.fullName} - {appointment.doctor?.doctorProfile?.specialization}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.startTime).toLocaleString()}
                          </p>
                          <p className="text-sm font-medium">
                            Status: <span className={`${
                              appointment.status === 'completed' ? 'text-green-600' :
                              appointment.status === 'cancelled' ? 'text-destructive' :
                              'text-yellow-600'
                            }`}>{appointment.status}</span>
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground italic">Notes: {appointment.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  {appointments.filter((apt) => apt.status !== 'scheduled').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No past appointments</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 