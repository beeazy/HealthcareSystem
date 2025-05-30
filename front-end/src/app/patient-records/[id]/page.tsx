"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { patientsApi } from "@/lib/api"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Layout } from "@/components/Layout"
import { Loading } from "@/components/ui/loading"
import { FileText, Calendar, User, Stethoscope, Clock, AlertCircle } from "lucide-react"
import Navigation from "@/components/Navigation"

interface PatientRecord {
  id: string
  patientId: string
  date: string
  diagnosis: string
  treatment: string
  notes: string
  doctorId: string
  doctorName: string
  followUpDate?: string
  medications?: string[]
  allergies?: string[]
}

interface Patient {
  id: number
  email: string
  fullName: string
  role: 'patient'
  phone?: string
  patientProfile: {
    dateOfBirth: string
    gender: string
    insuranceProvider?: string
    insuranceNumber?: string
  }
  createdAt: string
  updatedAt: string
}

export default function PatientRecordsPage() {
  const { id } = useParams()
  const { user, isAdmin, isDoctor } = useAuth()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const [patientData, recordsData] = await Promise.all([
          patientsApi.getPatient(id as string),
          patientsApi.getPatientRecords(id as string)
        ])
        setPatient(patientData)
        setRecords(recordsData)
      } catch (err) {
        setError('Failed to load patient records')
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [id])

  if (loading) {
    return (
      <Layout>
        <Loading message="Loading patient records..." />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor']}>
      <Navigation />
      <Layout>
        <div className="space-y-8">
          {/* Patient Overview */}
          <div className="animate-fade-in rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{patient?.fullName}</h1>
                  <p className="text-sm text-gray-600">Patient ID: {patient?.id}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                  Add New Record
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{patient?.patientProfile.dateOfBirth}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Gender</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{patient?.patientProfile.gender}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Insurance Provider</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{patient?.patientProfile.insuranceProvider || 'Not specified'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{records.length}</p>
              </div>
            </div>
          </div>

          {/* Medical Records */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Medical Records</h2>
            {records.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new medical record.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="animate-fade-in-delay rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">{record.doctorName}</p>
                        </div>
                      </div>
                      {record.followUpDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Follow-up: {record.followUpDate}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Diagnosis</p>
                        <p className="mt-1 text-gray-900">{record.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Treatment</p>
                        <p className="mt-1 text-gray-900">{record.treatment}</p>
                      </div>
                      {record.medications && record.medications.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Medications</p>
                          <ul className="mt-1 list-inside list-disc text-gray-900">
                            {record.medications.map((med, index) => (
                              <li key={index}>{med}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {record.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Notes</p>
                          <p className="mt-1 text-gray-900">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 