import { pgTable, serial, varchar, timestamp, integer, boolean, text, pgEnum } from 'drizzle-orm/pg-core';

// Enums for better type safety
export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'admin']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'completed', 'cancelled', 'no_show']);

// Users table - single source of truth for all user types
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull().default('patient'),
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Doctor profiles - additional info for users with doctor role
export const doctorProfiles = pgTable('doctor_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull().unique(),
    specialization: varchar('specialization', { length: 100 }).notNull(),
    licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
    isAvailable: boolean('is_available').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Patient profiles - additional info for users with patient role
export const patientProfiles = pgTable('patient_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull().unique(),
    dateOfBirth: varchar('date_of_birth', { length: 10 }).notNull(), // Format: YYYY-MM-DD
    gender: varchar('gender', { length: 10 }).notNull(),
    insuranceProvider: varchar('insurance_provider', { length: 100 }),
    insuranceNumber: varchar('insurance_number', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Appointments
export const appointments = pgTable('appointments', {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id').references(() => users.id).notNull(),
    doctorId: integer('doctor_id').references(() => users.id).notNull(),
    appointmentDate: timestamp('appointment_date').notNull(),
    status: appointmentStatusEnum('status').default('scheduled').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Medical Records - optional bonus feature
export const medicalRecords = pgTable('medical_records', {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id').references(() => users.id).notNull(),
    doctorId: integer('doctor_id').references(() => users.id).notNull(),
    appointmentId: integer('appointment_id').references(() => appointments.id),
    diagnosis: text('diagnosis').notNull(),
    prescription: text('prescription'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 