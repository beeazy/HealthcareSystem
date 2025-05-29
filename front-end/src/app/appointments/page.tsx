"use client"

import { useEffect, useState } from "react"
import { appointmentsApi, doctorsApi, patientsApi, type Appointment, type Doctor, type Patient, authApi } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, parseISO, isBefore, isAfter, addMinutes } from "date-fns"
import { Pencil, Plus, Check, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { z } from "zod"

// Define the appointment form schema
const appointmentFormSchema = z.object({
  patientId: z.number().min(1, "Please select a patient"),
  doctorId: z.number().min(1, "Please select a doctor"),
  startTime: z.string().min(1, "Please select a date and time"),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: 0,
      doctorId: 0,
      startTime: new Date().toISOString().slice(0, 16),
      notes: "",
      status: "scheduled",
    },
  })

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    if (!authApi.isAdmin()) {
      toast.error("You don't have permission to access this page")
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    loadData()
  }, [router])

  async function loadData() {
    try {
      const [doctorsData, patientsData] = await Promise.all([
        doctorsApi.getDoctors(),
        patientsApi.getPatients(),
      ])
      setDoctors(doctorsData.filter((doctor: Doctor) => doctor.doctorProfile.isActive))
      setPatients(patientsData)

      if (selectedDoctor) {
        const appointmentsData = await appointmentsApi.getDoctorAppointments()
        console.log('Doctor appointments:', appointmentsData) // Debug log
        setAppointments(appointmentsData.filter((app: Appointment) => app.doctorId === selectedDoctor.id))
      } else {
        const appointmentsData = await appointmentsApi.getPatientAppointments()
        console.log('Patient appointments:', appointmentsData) // Debug log
        setAppointments(appointmentsData)
      }
    } catch (error) {
      console.error('Error loading data:', error) // Debug log
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDoctor, selectedDate])

  function validateAppointmentTime(startTime: string, doctorId: number): boolean {
    const appointmentTime = parseISO(startTime)
    const now = new Date()

    if (isBefore(appointmentTime, now)) {
      toast.error("Cannot schedule appointments in the past")
      return false
    }

    const appointmentHour = appointmentTime.getHours()
    if (appointmentHour < 8 || appointmentHour >= 18) {
      toast.error("Appointments can only be scheduled between 8 AM and 6 PM")
      return false
    }

    const appointmentEndTime = addMinutes(appointmentTime, 30)
    const hasOverlap = appointments.some(appointment => {
      if (appointment.doctorId !== doctorId || appointment.status === 'cancelled') return false
      
      const existingStart = parseISO(appointment.startTime)
      const existingEnd = addMinutes(existingStart, 30)
      
      return (
        (isAfter(appointmentTime, existingStart) && isBefore(appointmentTime, existingEnd)) ||
        (isAfter(appointmentEndTime, existingStart) && isBefore(appointmentEndTime, existingEnd))
      )
    })

    if (hasOverlap) {
      toast.error("This time slot overlaps with an existing appointment")
      return false
    }

    return true
  }

  async function onSubmit(data: AppointmentFormValues) {
    try {
      if (editingAppointment) {
        if (data.status === 'cancelled') {
          await appointmentsApi.cancelAppointment(editingAppointment.id)
        } else {
          await appointmentsApi.createAppointment({
            patientId: data.patientId,
            doctorId: data.doctorId,
            startTime: data.startTime,
            notes: data.notes
          })
        }
        toast.success("Appointment updated successfully")
      } else {
        if (!validateAppointmentTime(data.startTime, data.doctorId)) {
          return
        }

        await appointmentsApi.createAppointment({
          patientId: data.patientId,
          doctorId: data.doctorId,
          startTime: data.startTime,
          notes: data.notes
        })
        toast.success("Appointment scheduled successfully")
      }
      setIsDialogOpen(false)
      form.reset()
      setEditingAppointment(null)
      loadData()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Time slot is not available")) {
          toast.error("This time slot is not available. Please choose another time.")
        } else if (error.message.includes("Doctor is not available")) {
          toast.error("The selected doctor is not available for appointments.")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Operation failed")
      }
    }
  }

  async function handleStatusChange(id: number, status: 'scheduled' | 'cancelled' | 'completed') {
    try {
      if (status === 'cancelled') {
        await appointmentsApi.cancelAppointment(id)
      } else {
        await appointmentsApi.createAppointment({
          patientId: appointments.find(app => app.id === id)?.patientId || 0,
          doctorId: appointments.find(app => app.id === id)?.doctorId || 0,
          startTime: appointments.find(app => app.id === id)?.startTime || "",
          notes: appointments.find(app => app.id === id)?.notes || ""
        })
      }
      toast.success("Appointment status updated successfully")
      loadData()
    } catch (error) {
      toast.error("Failed to update appointment status")
    }
  }

  function handleEdit(appointment: Appointment) {
    setEditingAppointment(appointment)
    form.reset({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      startTime: new Date(appointment.startTime).toISOString().slice(0, 16),
      notes: appointment.notes || "",
      status: appointment.status,
    })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Select
              value={selectedDoctor?.id.toString()}
              onValueChange={(value) => {
                const doctor = doctors.find(d => d.id.toString() === value)
                setSelectedDoctor(doctor || null)
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    {`${doctor.fullName} - ${doctor.doctorProfile.specialization}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[150px]"
            />
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingAppointment(null)
                  form.reset()
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAppointment ? "Update Appointment" : "Schedule New Appointment"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                  {patient.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doctorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a doctor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                  {`${doctor.fullName} - ${doctor.doctorProfile.specialization}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date & Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                              min={new Date().toISOString().slice(0, 16)}
                              step="1800" // 30 minutes in seconds
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {editingAppointment && (
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingAppointment ? "Update" : "Schedule"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>{appointment.patient?.fullName}</TableCell>
                <TableCell>
                  {appointment.doctor ? 
                    `${appointment.doctor.fullName} - ${appointment.doctor.doctorProfile.specialization}` : 
                    "-"
                  }
                </TableCell>
                <TableCell>
                  {format(new Date(appointment.startTime), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'}`}
                  >
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{appointment.notes || "-"}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(appointment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {appointment.status === 'scheduled' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 