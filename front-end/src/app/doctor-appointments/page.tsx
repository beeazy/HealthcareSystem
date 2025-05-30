'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { appointmentsApi, type Appointment } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { format, parseISO, isSameDay } from 'date-fns'
import { toast } from 'sonner'
import { CalendarIcon, X, ExternalLink } from 'lucide-react'
import { Loading } from "@/components/ui/loading"
import Navigation from '@/components/Navigation'
import { z } from 'zod'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

const medicalRecordSchema = z.object({
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatment: z.string().min(1, 'Treatment is required'),
  notes: z.string().optional(),
  medications: z.array(z.string()).optional(),
  followUpDate: z.string().optional()
})

type MedicalRecordForm = z.infer<typeof medicalRecordSchema>

export default function DoctorAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null)
  const [medicalRecordForm, setMedicalRecordForm] = useState<MedicalRecordForm>({
    diagnosis: '',
    treatment: '',
    notes: '',
    medications: [],
    followUpDate: ''
  })
  const [showMedicalForm, setShowMedicalForm] = useState(false)

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
          setSelectedAppointment(appointment)
          setShowMedicalForm(true)
          return
        }
      }
      await fetchAppointments()
    } catch (err) {
      console.error('Error updating appointment:', err)
      setError('Failed to update appointment status')
      toast.error('Failed to update appointment status')
    }
  }

  const handleMedicalRecordSubmit = async () => {
    if (!selectedAppointment) return

    try {
      const validatedData = medicalRecordSchema.parse(medicalRecordForm)
      await appointmentsApi.updateAppointment(selectedAppointment.id, {
        status: 'completed',
        ...validatedData
      })
      toast.success('Appointment completed and medical record created')
      setShowMedicalForm(false)
      setSelectedAppointment(null)
      setMedicalRecordForm({
        diagnosis: '',
        treatment: '',
        notes: '',
        medications: [],
        followUpDate: ''
      })
      await fetchAppointments()
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message)
      } else {
        toast.error('Failed to complete appointment')
      }
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
        <Loading message="Loading appointments..." />
      </Layout>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Navigation />
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(new Date(selectedDate), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate ? new Date(selectedDate) : undefined}
                        onSelect={(date) => setSelectedDate(date ? date.toISOString().split('T')[0] : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Medical Record Form Modal */}
            {showMedicalForm && selectedAppointment && (
              <Dialog open={showMedicalForm} onOpenChange={setShowMedicalForm}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Complete Appointment</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Link 
                        href={`/patient-records/${selectedAppointment.patientId}`}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Patient ID: {selectedAppointment.patientId}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span>•</span>
                      <span>{formatDateTime(selectedAppointment.startTime)}</span>
                    </div>
                  </DialogHeader>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnosis</label>
                      <input
                        type="text"
                        value={medicalRecordForm.diagnosis}
                        onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        placeholder="Enter patient diagnosis"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Treatment</label>
                      <input
                        type="text"
                        value={medicalRecordForm.treatment}
                        onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        placeholder="Enter prescribed treatment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                      <textarea
                        value={medicalRecordForm.notes}
                        onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                        rows={3}
                        placeholder="Additional notes about the appointment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Follow-up Date</label>
                      <input
                        type="date"
                        value={medicalRecordForm.followUpDate}
                        onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setShowMedicalForm(false)
                          setSelectedAppointment(null)
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleMedicalRecordSubmit}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500/20"
                      >
                        Complete Appointment
                      </button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

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
                          <Link 
                            href={`/patient-records/${appointment.patientId}`}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            Patient ID: {appointment.patientId}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
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
                          <Link 
                            href={`/patient-records/${appointment.patientId}`}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            Patient ID: {appointment.patientId}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
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