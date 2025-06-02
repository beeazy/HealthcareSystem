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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Appointments</h1>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <Button
                  variant={!selectedDate ? "secondary" : "outline"}
                  onClick={() => setSelectedDate('')}
                >
                  All Appointments
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(new Date(selectedDate), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate ? new Date(selectedDate) : undefined}
                      onSelect={(date: Date | undefined) => setSelectedDate(date ? date.toISOString().split('T')[0] : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Medical Record Form Modal */}
            <Dialog open={showMedicalForm} onOpenChange={setShowMedicalForm}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Complete Appointment</DialogTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Link 
                      href={`/patient-records/${selectedAppointment?.patientId}`}
                      className="flex items-center gap-1 text-primary hover:text-primary/90 hover:underline"
                    >
                      Patient ID: {selectedAppointment?.patientId}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <span>•</span>
                    <span>{selectedAppointment && formatDateTime(selectedAppointment.startTime)}</span>
                  </div>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Diagnosis</label>
                    <Input
                      value={medicalRecordForm.diagnosis}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                      placeholder="Enter patient diagnosis"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Treatment</label>
                    <Input
                      value={medicalRecordForm.treatment}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                      placeholder="Enter prescribed treatment"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                      value={medicalRecordForm.notes}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      rows={3}
                      placeholder="Additional notes about the appointment"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Follow-up Date</label>
                    <Input
                      type="date"
                      value={medicalRecordForm.followUpDate}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowMedicalForm(false)
                        setSelectedAppointment(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleMedicalRecordSubmit}>
                      Complete Appointment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Upcoming Appointments */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
                <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">Upcoming Appointments</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {filteredAppointments
                    .filter((apt) => apt.status === 'scheduled')
                    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors duration-200"
                      >
                        <div className="space-y-1">
                          <Link 
                            href={`/patient-records/${appointment.patientId}`}
                            className="flex items-center gap-1 text-primary hover:text-primary/90 hover:underline"
                          >
                            Patient ID: {appointment.patientId}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(appointment.startTime)}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground italic">Notes: {appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                            variant="outline"
                            className="flex-1 sm:flex-none text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700"
                          >
                            Complete
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            variant="outline"
                            className="flex-1 sm:flex-none text-destructive border-destructive/20 bg-destructive/10 hover:bg-destructive/20 hover:text-destructive"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  {filteredAppointments.filter((apt) => apt.status === 'scheduled').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {selectedDate ? 'No upcoming appointments for this date' : 'No upcoming appointments'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Past Appointments */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
                <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">Past Appointments</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {filteredAppointments
                    .filter((apt) => apt.status !== 'scheduled')
                    .sort((a, b) => parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors duration-200"
                      >
                        <div className="space-y-1">
                          <Link 
                            href={`/patient-records/${appointment.patientId}`}
                            className="flex items-center gap-1 text-primary hover:text-primary/90 hover:underline"
                          >
                            Patient ID: {appointment.patientId}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(appointment.startTime)}
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
                  {filteredAppointments.filter((apt) => apt.status !== 'scheduled').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {selectedDate ? 'No past appointments for this date' : 'No past appointments'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">{error}</h3>
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