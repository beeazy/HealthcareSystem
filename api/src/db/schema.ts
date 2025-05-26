import { pgTable, serial, varchar, timestamp, integer, boolean, text } from 'drizzle-orm/pg-core';

export const patients = pgTable('patients', {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    dateOfBirth: timestamp('date_of_birth').notNull(),
    gender: varchar('gender', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const doctors = pgTable('doctors', {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    specialization: varchar('specialization', { length: 100 }).notNull(),
    licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
    isAvailable: boolean('is_available').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appointments = pgTable('appointments', {
    id: serial('id').primaryKey(),
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