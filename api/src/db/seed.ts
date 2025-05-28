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
        phone: '0722334455',
      },
      {
        email: 'wanjiku.muthoni@example.com',
        password: await hash('password123', 10),
        fullName: 'Wanjiku Muthoni',
        role: 'patient',
        phone: '0722334455',
      },
      {
        email: 'john.doe@example.com',
        password: await hash('password123', 10),
        fullName: 'John Doe',
        role: 'patient',
        phone: '0722334456',
      },
      {
        email: 'jane.smith@example.com',
        password: await hash('password123', 10),
        fullName: 'Jane Smith',
        role: 'patient',
        phone: '0722334457',
      },
      {
        email: 'peter.parker@example.com',
        password: await hash('password123', 10),
        fullName: 'Peter Parker',
        role: 'patient',
        phone: '0722334458',
      }
    ]).returning();

    // Insert patient profiles
    await db.insert(patientProfiles).values([
      {
        userId: patient1.id,
        dateOfBirth: '1985-06-15',
        gender: 'male',
        insuranceProvider: 'NHIF',
        insuranceNumber: '1234567890',
      },
      {
        userId: patient2.id,
        dateOfBirth: '1990-03-20',
        gender: 'female',
        insuranceProvider: 'NHIF',
        insuranceNumber: '1234567890',
      },
      {
        userId: patient3.id,
        dateOfBirth: '1978-12-05',
        gender: 'male',
        insuranceProvider: 'SHIF',
        insuranceNumber: '9876543210',
      },
      {
        userId: patient4.id,
        dateOfBirth: '1995-08-15',
        gender: 'female',
        insuranceProvider: 'CIC',
        insuranceNumber: '4567891230',
      },
      {
        userId: patient5.id,
        dateOfBirth: '1988-04-25',
        gender: 'male',
        insuranceProvider: 'Britam',
        insuranceNumber: '7891234560',
      }
    ]);

    // Insert test doctors
    const [doctor1, doctor2, doctor3, doctor4, doctor5] = await db.insert(users).values([
      {
        email: 'james.ochieng@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. James Ochieng',
        role: 'doctor',
        phone: '+254 734 567 890',
      },
      {
        email: 'mary.wambui@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Mary Wambui',
        role: 'doctor',
        phone: '+254 745 678 901',
      },
      {
        email: 'sarah.johnson@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Sarah Johnson',
        role: 'doctor',
        phone: '+254 756 789 012',
      },
      {
        email: 'michael.chen@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Michael Chen',
        role: 'doctor',
        phone: '+254 767 890 123',
      },
      {
        email: 'lisa.wang@knh.co.ke',
        password: await hash('password123', 10),
        fullName: 'Dr. Lisa Wang',
        role: 'doctor',
        phone: '+254 778 901 234',
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
        specialization: 'Pediatrics',
        licenseNumber: 'KMPDB567890',
        isActive: false,
      }
    ]);

    // Insert test appointments
    const today = new Date();
    const appointmentsData = [
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        appointmentDate: new Date(today.setHours(10, 0, 0, 0)),
        status: 'scheduled' as const,
        notes: 'Follow-up for diabetes management',
      },
      {
        patientId: patient2.id,
        doctorId: doctor2.id,
        appointmentDate: new Date(today.setHours(14, 30, 0, 0)),
        status: 'scheduled' as const,
        notes: 'Child vaccination schedule',
      },
      {
        patientId: patient3.id,
        doctorId: doctor3.id,
        appointmentDate: new Date(today.setDate(today.getDate() + 1)),
        status: 'scheduled' as const,
        notes: 'Cardiac consultation',
      },
      {
        patientId: patient4.id,
        doctorId: doctor4.id,
        appointmentDate: new Date(today.setDate(today.getDate() + 2)),
        status: 'scheduled' as const,
        notes: 'Neurological assessment',
      },
      {
        patientId: patient5.id,
        doctorId: doctor5.id,
        appointmentDate: new Date(today.setDate(today.getDate() - 1)),
        status: 'completed' as const,
        notes: 'Regular checkup',
      }
    ];

    await db.insert(appointments).values(appointmentsData);

    // Insert test medical records
    await db.insert(medicalRecords).values([
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        diagnosis: 'Type 2 Diabetes',
        prescription: 'Metformin 500mg twice daily',
        notes: 'Patient shows good glycemic control. Continue with current medication and lifestyle modifications.',
      },
      {
        patientId: patient2.id,
        doctorId: doctor2.id,
        diagnosis: 'Malaria',
        prescription: 'Artemether-Lumefantrine 20/120mg tablets',
        notes: 'Patient responded well to treatment. Complete full course of medication.',
      },
      {
        patientId: patient3.id,
        doctorId: doctor3.id,
        diagnosis: 'Hypertension',
        prescription: 'Amlodipine 5mg daily',
        notes: 'Blood pressure readings show improvement. Continue medication and regular monitoring.',
      },
      {
        patientId: patient4.id,
        doctorId: doctor4.id,
        diagnosis: 'Migraine',
        prescription: 'Sumatriptan 50mg as needed',
        notes: 'Patient reports reduced frequency of headaches. Continue current treatment plan.',
      },
      {
        patientId: patient5.id,
        doctorId: doctor5.id,
        diagnosis: 'Common Cold',
        prescription: 'Paracetamol 500mg as needed',
        notes: 'Symptoms improving. Rest and hydration recommended.',
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