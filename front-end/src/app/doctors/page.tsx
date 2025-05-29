"use client"

import { useEffect, useState } from "react"
import { doctorsApi, type Doctor, type DoctorInput } from "@/lib/api"
import { useAuth } from "@/lib/auth"
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
import { Loading } from "@/components/ui/loading"
import { Layout } from "@/components/Layout"
import Navigation from "@/components/Navigation"

export default function DoctorsPage() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

  const form = useForm<DoctorInput>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      specialization: "",
      licenseNumber: "",
      password: "",
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
      fullName: doctor.fullName,
      email: doctor.email,
      phone: doctor.phone || "",
      specialization: doctor.doctorProfile.specialization,
      licenseNumber: doctor.doctorProfile.licenseNumber,
      password: "",
    })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Layout>
        <Loading message="Loading doctors..." />
      </Layout>
    )
  }

  return (
    <div>
      <Navigation />

      <Layout>
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Doctors</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

          {/* Add Doctor Button for the admin only */}
          {user?.role === "admin" && (
            <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDoctor(null)
              form.reset()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </DialogTrigger>
          )}
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[120px]">Phone</TableHead>
                <TableHead className="min-w-[150px]">Specialization</TableHead>
                <TableHead className="min-w-[120px]">License</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                {user?.role === "admin" && (
                  <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.fullName}</TableCell>
                  <TableCell className="whitespace-nowrap">{doctor.email}</TableCell>
                  <TableCell className="whitespace-nowrap">{doctor.phone || "-"}</TableCell>
                  <TableCell>{doctor.doctorProfile.specialization}</TableCell>
                  <TableCell className="whitespace-nowrap">{doctor.doctorProfile.licenseNumber}</TableCell>
                  <TableCell>
                    {doctor.doctorProfile.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  {user?.role === "admin" && (
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(doctor)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doctor.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
      </Layout>
    </div>
  )
} 