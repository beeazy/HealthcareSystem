"use client";

import { useEffect, useState } from "react";
import {
  appointmentsApi,
  doctorsApi,
  patientsApi,
  type Appointment,
  type Doctor,
  type Patient,
  authApi,
} from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isBefore, isAfter, addMinutes, parse } from "date-fns";
import { Pencil, Plus, Check, X, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { Loading } from "@/components/ui/loading";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/lib/auth";
import { useDebounce } from "@/lib/hooks";

// Define the appointment form schema
const appointmentFormSchema = z.object({
  patientId: z.number().min(1, "Please select a patient"),
  doctorId: z.number().min(1, "Please select a doctor"),
  startTime: z.string().min(1, "Please select a date and time"),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
}

function PatientSearch({ onSelect }: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    async function searchPatients() {
      if (!debouncedSearch || debouncedSearch.length < 3) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const results = await patientsApi.searchPatients(debouncedSearch);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching patients:', error);
        toast.error('Failed to search patients');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }

    searchPatients();
  }, [debouncedSearch]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by phone, email, or insurance number (min. 3 characters)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      {isSearching && (
        <div className="text-sm text-muted-foreground">Searching...</div>
      )}
      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <div className="text-sm text-muted-foreground">
          Please enter at least 3 characters to search
        </div>
      )}
      {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
        <div className="text-sm text-muted-foreground">
          No patients found
        </div>
      )}
      {searchResults.length > 0 && (
        <div className="border rounded-md divide-y">
          {searchResults.map((patient) => (
            <button
              key={patient.id}
              onClick={() => {
                onSelect(patient);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground flex flex-col gap-1"
            >
              <span className="font-medium">{patient.fullName}</span>
              <span className="text-sm text-muted-foreground">
                {patient.email} • {patient.phone}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const { isAdmin, isDoctor, isReceptionist } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(new Date().setHours(0, 0, 0, 0))
  );

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: 0,
      doctorId: 0,
      startTime: new Date().toISOString().slice(0, 16),
      notes: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (!isAdmin && !isReceptionist) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
      return;
    }

    loadData();
  }, [isAdmin, isDoctor, isReceptionist, router]);

  async function loadData() {
    try {
      const [doctorsData, patientsData] = await Promise.all([
        doctorsApi.getDoctors(),
        patientsApi.getPatients(),
      ]);
      setDoctors(
        doctorsData.filter((doctor: Doctor) => doctor.doctorProfile.isActive)
      );
      setPatients(patientsData);

      const appointmentsData = await appointmentsApi.getAppointments();
        setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error loading data:", error); // Debug log
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedDoctor, selectedDate]);

  function validateAppointmentTime(
    startTime: string,
    doctorId: number
  ): boolean {
    const appointmentTime = parseISO(startTime);
    const now = new Date();

    if (isBefore(appointmentTime, now)) {
      toast.error("Cannot schedule appointments in the past");
      return false;
    }

    const appointmentHour = appointmentTime.getHours();
    if (appointmentHour < 8 || appointmentHour >= 18) {
      toast.error("Appointments can only be scheduled between 8 AM and 6 PM");
      return false;
    }

    const appointmentEndTime = addMinutes(appointmentTime, 30);
    const hasOverlap = appointments.some((appointment) => {
      if (
        appointment.doctorId !== doctorId ||
        appointment.status === "cancelled"
      )
        return false;

      const existingStart = parseISO(appointment.startTime);
      const existingEnd = addMinutes(existingStart, 30);

      return (
        (isAfter(appointmentTime, existingStart) &&
          isBefore(appointmentTime, existingEnd)) ||
        (isAfter(appointmentEndTime, existingStart) &&
          isBefore(appointmentEndTime, existingEnd))
      );
    });

    if (hasOverlap) {
      toast.error("This time slot overlaps with an existing appointment");
      return false;
    }

    return true;
  }

  async function onSubmit(data: AppointmentFormValues) {
    try {
      if (editingAppointment) {
        if (data.status === "cancelled") {
          await appointmentsApi.cancelAppointment(editingAppointment.id);
        } else {
          await appointmentsApi.createAppointment({
            patientId: data.patientId,
            doctorId: data.doctorId,
            startTime: data.startTime,
            notes: data.notes,
          });
        }
        toast.success("Appointment updated successfully");
      } else {
        if (!validateAppointmentTime(data.startTime, data.doctorId)) {
          return;
        }

        await appointmentsApi.createAppointment({
          patientId: data.patientId,
          doctorId: data.doctorId,
          startTime: data.startTime,
          notes: data.notes,
        });
        toast.success("Appointment scheduled successfully");
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingAppointment(null);
      loadData();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Time slot is not available")) {
          toast.error(
            "This time slot is not available. Please choose another time."
          );
        } else if (error.message.includes("Doctor is not available")) {
          toast.error("The selected doctor is not available for appointments.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Operation failed");
      }
    }
  }

  async function handleStatusChange(
    id: number,
    status: "scheduled" | "cancelled" | "completed"
  ) {
    try {
      if (status === "cancelled") {
        await appointmentsApi.cancelAppointment(id);
      } else {
        await appointmentsApi.createAppointment({
          patientId: appointments.find((app) => app.id === id)?.patientId || 0,
          doctorId: appointments.find((app) => app.id === id)?.doctorId || 0,
          startTime: appointments.find((app) => app.id === id)?.startTime || "",
          notes: appointments.find((app) => app.id === id)?.notes || "",
        });
      }
      toast.success("Appointment status updated successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to update appointment status");
    }
  }

  function handleEdit(appointment: Appointment) {
    setEditingAppointment(appointment);
    form.reset({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      startTime: new Date(appointment.startTime).toISOString().slice(0, 16),
      notes: appointment.notes || "",
      status: appointment.status,
    });
    setIsDialogOpen(true);
  }

  if (isLoading) {
    return (
      <Layout>
        <Loading message="Loading appointments..." />
      </Layout>
    );
  }

  return (
    <div>
      <Navigation />
      <Layout>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Appointments</h1>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 items-start xs:items-center w-full sm:w-auto">
                <Select
                  value={selectedDoctor?.id.toString()}
                  onValueChange={(value) => {
                    const doctor = doctors.find(
                      (d) => d.id.toString() === value
                    );
                    setSelectedDoctor(doctor || null);
                  }}
                >
                  <SelectTrigger className="w-full xs:w-[200px]">
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
                <div className="w-full xs:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full xs:w-[150px] justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            const newDate = new Date(date);
                            newDate.setHours(0, 0, 0, 0);
                            setSelectedDate(newDate);
                          }
                        }}
                        disabled={(date) => 
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {(isAdmin || isReceptionist) && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingAppointment(null);
                        form.reset();
                      }}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAppointment
                          ? "Update Appointment"
                          : "Schedule New Appointment"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="patientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Patient</FormLabel>
                              <PatientSearch
                                onSelect={(patient) => {
                                  field.onChange(patient.id);
                                  form.setValue("patientId", patient.id);
                                }}
                              />
                              {field.value > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Selected patient: {patients.find(p => p.id === field.value)?.fullName}
                                </div>
                              )}
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
                                onValueChange={(value) =>
                                  field.onChange(Number(value))
                                }
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a doctor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {doctors.map((doctor) => (
                                    <SelectItem
                                      key={doctor.id}
                                      value={doctor.id.toString()}
                                    >
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
                            <FormItem className="flex flex-col">
                              <FormLabel>Date & Time</FormLabel>
                              <div className="flex flex-col gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(new Date(field.value), "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value ? new Date(field.value) : undefined}
                                      onSelect={(date) => {
                                        if (date) {
                                          const currentValue = field.value ? new Date(field.value) : new Date();
                                          const newDate = new Date(date);
                                          newDate.setHours(currentValue.getHours());
                                          newDate.setMinutes(currentValue.getMinutes());
                                          field.onChange(newDate.toISOString());
                                        }
                                      }}
                                      disabled={(date) => 
                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <Select
                                  onValueChange={(time) => {
                                    const [hours, minutes] = time.split(':');
                                    const newDate = field.value ? new Date(field.value) : new Date();
                                    newDate.setHours(parseInt(hours));
                                    newDate.setMinutes(parseInt(minutes));
                                    field.onChange(newDate.toISOString());
                                  }}
                                  defaultValue={field.value ? 
                                    format(new Date(field.value), 'HH:mm') : 
                                    '09:00'
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.from({ length: 18 }, (_, i) => i + 9).map((hour) => (
                                      [0, 30].map((minute) => {
                                        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                        const date = new Date();
                                        date.setHours(hour);
                                        date.setMinutes(minute);
                                        return (
                                          <SelectItem key={time} value={time}>
                                            {format(date, 'h:mm a')}
                                          </SelectItem>
                                        );
                                      })
                                    )).flat()}
                                  </SelectContent>
                                </Select>
                              </div>
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
                                    <SelectItem value="scheduled">
                                      Scheduled
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      Completed
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                      Cancelled
                                    </SelectItem>
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

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Patient</TableHead>
                  <TableHead className="min-w-[180px]">Doctor</TableHead>
                  <TableHead className="min-w-[150px]">Date & Time</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Notes</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right min-w-[100px]">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => {
                  const patient = patients.find(p => p.id === appointment.patientId);
                  const doctor = doctors.find(d => d.id === appointment.doctorId);
                  
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {patient?.fullName || `Patient ID: ${appointment.patientId}`}
                      </TableCell>
                      <TableCell>
                        {doctor ? (
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1">
                            <span>{doctor.fullName}</span>
                            <span className="text-muted-foreground text-sm">
                              {doctor.doctorProfile.specialization}
                            </span>
                          </div>
                        ) : (
                          `Doctor ID: ${appointment.doctorId}`
                        )}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(appointment.startTime),
                          "MMM d, yyyy h:mm a"
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                        ${
                          appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {appointment.notes || "-"}
                      </TableCell>
                      {(isAdmin || isReceptionist) && (
                        <TableCell className="text-right space-x-1 md:space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(appointment)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {appointment.status === "scheduled" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleStatusChange(appointment.id, "completed")
                                }
                                className="h-8 w-8"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleStatusChange(appointment.id, "cancelled")
                                }
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Layout>
    </div>
  );
}
