import { pgTable, serial, varchar, timestamp, integer, boolean, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('doctor'),
    doctorId: integer('doctor_id').references(() => doctors.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const patients = pgTable('patients', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    dateOfBirth: timestamp('date_of_birth').notNull(),
    gender: varchar('gender', { length: 10 }).notNull(),
    contactInfo: varchar('contact_info', { length: 255 }).notNull(),
    insuranceProvider: varchar('insurance_provider', { length: 100 }),
    insuranceNumber: varchar('insurance_number', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const doctors = pgTable('doctors', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    specialization: varchar('specialization', { length: 100 }).notNull(),
    licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
    isAvailable: boolean('is_available').default(true),
    isActive: boolean('is_active').default(true), // used to soft delete the doctor
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appointments = pgTable('appointments', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    patientId: integer('patient_id').references(() => patients.id).notNull(),
    doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
    appointmentDate: timestamp('appointment_date').notNull(),
    status: varchar('status', { length: 20 }).default('scheduled').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const medicalRecords = pgTable('medical_records', {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id').references(() => patients.id).notNull(),
    doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
    diagnosis: text('diagnosis').notNull(),
    prescription: text('prescription'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 