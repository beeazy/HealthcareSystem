import { Request, Response } from 'express';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { users, doctors } from '../../db/schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod/v4';

const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['admin', 'doctor'], {
    message: "Invalid role"
  }),
  // Additional fields for doctors
  phone: z.string().check(
    z.minLength(8, { message: "Phone number must be at least 8 characters long" }),
  ).optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
}).strict();

// Special admin creation schema
export const createAdminSchema = createUserSchema.extend({
  adminKey: z.string().min(1)
});

// Token generation
const generateToken = (user: any) => {
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role,
      email: user.email 
    }, 
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Login handler
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create user handler (admin only)
export const createUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, firstName, lastName, role, phone, specialization, licenseNumber } = createUserSchema.parse(req.body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      let doctorId = null;

      // If creating a doctor, create doctor record first
      if (role === 'doctor') {
        if (!specialization || !licenseNumber) {
          throw new Error('Specialization and license number are required for doctors');
        }

        const [doctor] = await tx
          .insert(doctors)
          .values({
            firstName,
            lastName,
            email,
            phone,
            specialization,
            licenseNumber,
            isAvailable: true,
            isActive: true
          })
          .returning();

        doctorId = doctor.id;
      }

      // Create user record
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          doctorId
        })
        .returning();

      return { user: newUser, doctorId };
    });

    const token = generateToken(result.user);
    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({ 
      user: userWithoutPassword, 
      token,
      doctorId: result.doctorId 
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { adminKey, ...userData } = createAdminSchema.parse(req.body);

    if (!ADMIN_CREATION_KEY || adminKey !== ADMIN_CREATION_KEY) {
      return res.status(403).json({ error: 'Invalid admin creation key' });
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email));

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create admin user
    const [newUser] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        role: 'admin', 
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ 
      user: userWithoutPassword, 
      token
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Some fields are missing'
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
