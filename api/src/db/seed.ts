import { db } from './index';
import { users, doctorProfiles, patientProfiles, appointments, medicalRecords } from './schema';
import { hash } from 'bcrypt';

async function seed() {
  try {
    // Clear existing data
    await db.delete(medicalRecords);
    await db.delete(appointments);
    await db.delete(doctorProfiles);
    await db.delete(patientProfiles);
    await db.delete(users);

    // Insert test patients
    const [patient1, patient2, patient3, patient4, patient5] = await db.insert(users).values([
      {
        email: 'kamau.njoroge@example.com',
        password: await hash('password123', 10),
        fullName: 'Kamau Njoroge',
        role: 'patient',
        phone: '+254 722 334455',
      },
      {
        email: 'wanjiku.muthoni@example.com',
        password: await hash('password123', 10),
        fullName: 'Wanjiku Muthoni',
        role: 'patient',
        phone: '+254 733 445566',
      },
      {
        email: 'john.doe@example.com',
        password: await hash('password123', 10),
        fullName: 'John Doe',
        role: 'patient',
        phone: '+254 744 556677',
      },
      {
        email: 'jane.smith@example.com',
        password: await hash('password123', 10),
        fullName: 'Jane Smith',
        role: 'patient',
        phone: '+254 755 667788',
      },
      {
        email: 'peter.parker@example.com',
        password: await hash('password123', 10),
        fullName: 'Peter Parker',
        role: 'patient',
        phone: '+254 766 778899',
      }
    ]).returning();

    // Insert patient profiles
    await db.insert(patientProfiles).values([
      {
        userId: patient1.id,
        dateOfBirth: '1985-06-15',
        gender: 'male',
        insuranceProvider: 'NHIF',
        insuranceNumber: 'NHIF123456',
      },
      {
        userId: patient2.id,
        dateOfBirth: '1990-03-20',
        gender: 'female',
        insuranceProvider: 'NHIF',
        insuranceNumber: 'NHIF654321',
      },
      {
        userId: patient3.id,
        dateOfBirth: '1978-12-05',
        gender: 'male',
        insuranceProvider: 'Britam',
        insuranceNumber: 'BRITAM987654',
      },
      {
        userId: patient4.id,
        dateOfBirth: '1995-08-15',
        gender: 'female',
        insuranceProvider: 'CIC',
        insuranceNumber: 'CIC456789',
      },
      {
        userId: patient5.id,
        dateOfBirth: '1988-04-25',
        gender: 'male',
        insuranceProvider: 'Jubilee',
        insuranceNumber: 'JUBILEE789123',
      }
    ]);

    // Insert test doctors
    const [doctor1, doctor2, doctor3, doctor4, doctor5] = await db.insert(users).values([
      {
        email: 'james.ochieng@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. James Ochieng',
        role: 'doctor',
        phone: '+254 734 567890',
      },
      {
        email: 'mary.wambui@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Mary Wambui',
        role: 'doctor',
        phone: '+254 745 678901',
      },
      {
        email: 'sarah.johnson@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Sarah Johnson',
        role: 'doctor',
        phone: '+254 756 789012',
      },
      {
        email: 'michael.chen@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Michael Chen',
        role: 'doctor',
        phone: '+254 767 890123',
      },
      {
        email: 'lisa.wang@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Lisa Wang',
        role: 'doctor',
        phone: '+254 778 901234',
      }
    ]).returning();

    // Insert doctor profiles
    await db.insert(doctorProfiles).values([
      {
        userId: doctor1.id,
        specialization: 'Internal Medicine',
        licenseNumber: 'KMPDB123456',
        isActive: true,
      },
      {
        userId: doctor2.id,
        specialization: 'Pediatrics',
        licenseNumber: 'KMPDB789012',
        isActive: true,
      },
      {
        userId: doctor3.id,
        specialization: 'Cardiology',
        licenseNumber: 'KMPDB345678',
        isActive: true,
      },
      {
        userId: doctor4.id,
        specialization: 'Neurology',
        licenseNumber: 'KMPDB901234',
        isActive: true,
      },
      {
        userId: doctor5.id,
        specialization: 'Dermatology',
        licenseNumber: 'KMPDB567890',
        isActive: false,
      }
    ]);

    // Insert test appointments with proper start and end times
    const now = new Date();
    const appointmentsData = [
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30),
        status: 'scheduled' as const,
        notes: 'Follow-up for diabetes management',
      },
      {
        patientId: patient2.id,
        doctorId: doctor2.id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0),
        status: 'scheduled' as const,
        notes: 'Child vaccination schedule',
      },
      {
        patientId: patient3.id,
        doctorId: doctor3.id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 45),
        status: 'scheduled' as const,
        notes: 'Cardiac consultation',
      },
      {
        patientId: patient4.id,
        doctorId: doctor4.id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 30),
        status: 'no_show' as const,
        notes: 'Neurological assessment - Patient did not show up',
      },
      {
        patientId: patient5.id,
        doctorId: doctor5.id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 15, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 15, 30),
        status: 'completed' as const,
        notes: 'Regular checkup',
      }
    ];

    const insertedAppointments = await db.insert(appointments).values(appointmentsData).returning();

    // Insert medical records with appointment links
    await db.insert(medicalRecords).values([
      // Patient 1 - Recent visit
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        appointmentId: insertedAppointments[0].id,
        diagnosis: 'Type 2 Diabetes',
        prescription: 'Metformin 500mg twice daily',
        notes: 'Blood sugar levels stable. Continue current medication. Next review in 3 months.',
      },
      // Patient 1 - Previous visit
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        diagnosis: 'Hypertension',
        prescription: 'Amlodipine 5mg daily',
        notes: 'Blood pressure: 130/85. Well controlled on current medication.',
      },
      // Patient 2 - Recent visit
      {
        patientId: patient2.id,
        doctorId: doctor2.id,
        appointmentId: insertedAppointments[1].id,
        diagnosis: 'Upper Respiratory Tract Infection',
        prescription: 'Amoxicillin 500mg TID for 5 days',
        notes: 'Fever, sore throat. Follow up if symptoms persist.',
      },
      // Patient 3 - Scheduled appointment
      {
        patientId: patient3.id,
        doctorId: doctor3.id,
        appointmentId: insertedAppointments[2].id,
        diagnosis: 'Hypertension with Cardiac Arrhythmia',
        prescription: 'Continue current medications. Added Beta blocker.',
        notes: 'ECG shows occasional PVCs. Monitor and review in 2 weeks.',
      },
      // Patient 4 - No show appointment
      {
        patientId: patient4.id,
        doctorId: doctor4.id,
        appointmentId: insertedAppointments[3].id,
        diagnosis: 'Chronic Migraine - Follow up',
        prescription: 'Continue Sumatriptan PRN',
        notes: 'Patient did not attend. Rescheduling recommended.',
      },
      // Patient 5 - Completed recent visit
      {
        patientId: patient5.id,
        doctorId: doctor5.id,
        appointmentId: insertedAppointments[4].id,
        diagnosis: 'Seasonal Allergic Rhinitis',
        prescription: 'Cetirizine 10mg daily PRN',
        notes: 'Symptoms well controlled. Review if worsening.',
      }
    ]);

    console.log('✅ Seed data inserted successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });