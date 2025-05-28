import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const createDoctorSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    phone: z.string().optional(),
    specialization: z.string(),
    licenseNumber: z.string(),
});

export const createAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    adminKey: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>; 