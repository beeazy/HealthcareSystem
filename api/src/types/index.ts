export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor';
  doctorId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: number;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  contactInfo: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  licenseNumber: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
