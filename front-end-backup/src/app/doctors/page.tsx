"use client"

import { useEffect, useState } from "react"
import { doctorsApi, type Doctor, type DoctorInput } from "@/lib/api"
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
import { doctorSchema } from "@/lib/api"
import { Pencil, Trash2, Plus } from "lucide-react"

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

  const form = useForm<DoctorInput>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialization: "",
      licenseNumber: "",
      isAvailable: true,
      isActive: true,
    },
  })

  useEffect(() => {
    loadDoctors()
  }, [])

  async function loadDoctors() {
    try {
      const data = await doctorsApi.getDoctors()
      setDoctors(data)
    } catch (error) {
      toast.error("Failed to load doctors")
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data: DoctorInput) {
    try {
      if (editingDoctor) {
        await doctorsApi.updateDoctor(editingDoctor.id, data)
        toast.success("Doctor updated successfully")
      } else {
        await doctorsApi.addDoctor(data)
        toast.success("Doctor added successfully")
      }
      setIsDialogOpen(false)
      form.reset()
      setEditingDoctor(null)
      loadDoctors()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this doctor?")) return

    try {
      await doctorsApi.deleteDoctor(id)
      toast.success("Doctor deleted successfully")
      loadDoctors()
    } catch (error) {
      toast.error("Failed to delete doctor")
    }
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor)
    form.reset({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      phone: doctor.phone || "",
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      isAvailable: doctor.isAvailable,
      isActive: doctor.isActive,
    })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Doctors</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDoctor(null)
              form.reset()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {editingDoctor ? "Update Doctor" : "Add Doctor"}
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
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>License Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>{`${doctor.firstName} ${doctor.lastName}`}</TableCell>
                <TableCell>{doctor.email}</TableCell>
                <TableCell>{doctor.phone || "-"}</TableCell>
                <TableCell>{doctor.specialization}</TableCell>
                <TableCell>{doctor.licenseNumber}</TableCell>
                <TableCell>
                  {doctor.isActive ? (
                    doctor.isAvailable ? (
                      <span className="text-green-600">Available</span>
                    ) : (
                      <span className="text-yellow-600">Busy</span>
                    )
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(doctor)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doctor.id)}
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