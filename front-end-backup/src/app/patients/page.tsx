"use client"

import { useEffect, useState } from "react"
import { patientsApi, type Patient, type PatientInput } from "@/lib/api"
import { toast } from "sonner"
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
import { patientSchema } from "@/lib/api"
import { format } from "date-fns"
import { Pencil, Trash2, Plus } from "lucide-react"

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  const form = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: new Date().toISOString().split('T')[0],
      gender: "",
      contactInfo: "",
      insuranceProvider: "",
      insuranceNumber: "",
    },
  })

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    try {
      const data = await patientsApi.getPatients()
      setPatients(data)
    } catch (error) {
      toast.error("Failed to load patients")
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data: PatientInput) {
    try {
      if (editingPatient) {
        await patientsApi.updatePatient(editingPatient.id, data)
        toast.success("Patient updated successfully")
      } else {
        await patientsApi.addPatient(data)
        toast.success("Patient added successfully")
      }
      setIsDialogOpen(false)
      form.reset()
      setEditingPatient(null)
      loadPatients()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this patient?")) return

    try {
      await patientsApi.deletePatient(id)
      toast.success("Patient deleted successfully")
      loadPatients()
    } catch (error) {
      toast.error("Failed to delete patient")
    }
  }

  function handleEdit(patient: Patient) {
    setEditingPatient(patient)
    form.reset({
      fullName: patient.fullName,
      dateOfBirth: new Date(patient.dateOfBirth).toISOString().split('T')[0],
      gender: patient.gender,
      contactInfo: patient.contactInfo,
      insuranceProvider: patient.insuranceProvider || "",
      insuranceNumber: patient.insuranceNumber || "",
    })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPatient(null)
              form.reset()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPatient ? "Edit Patient" : "Add New Patient"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Info</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {editingPatient ? "Update Patient" : "Add Patient"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Insurance Provider</TableHead>
              <TableHead>Insurance Number</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{patient.fullName}</TableCell>
                <TableCell>
                  {format(new Date(patient.dateOfBirth), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{patient.gender}</TableCell>
                <TableCell>{patient.contactInfo}</TableCell>
                <TableCell>{patient.insuranceProvider}</TableCell>
                <TableCell>{patient.insuranceNumber}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(patient)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(patient.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 