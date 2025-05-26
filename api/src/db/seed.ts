import { db } from './index';
import { patients, doctors, appointments, medicalRecords } from './schema';

async function seed() {
  try {
    // Clear existing data
    await db.delete(medicalRecords);
    await db.delete(appointments);
    await db.delete(doctors);
    await db.delete(patients);

    // Insert test patients
    const [patient1, patient2] = await db.insert(patients).values([
      {
        fullName: 'Kamau Njoroge',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'male',
        contactInfo: '0722334455',
        insuranceProvider: 'AIA',
        insuranceNumber: '1234567890',
      },
      {
        fullName: 'Wanjiku Muthoni',
        dateOfBirth: new Date('1990-03-20'),
        gender: 'female',
        contactInfo: '0722334455',
        insuranceProvider: 'AIA',
        insuranceNumber: '1234567890',
      },
    ]).returning();

    // Insert test doctors
    const [doctor1, doctor2] = await db.insert(doctors).values([
      {
        firstName: 'Dr. James',
        lastName: 'Ochieng',
        email: 'james.ochieng@knh.co.ke',
        phone: '+254 734 567 890',
        specialization: 'Internal Medicine',
        licenseNumber: 'KMPDB123456',
        isAvailable: true,
      },
      {
        firstName: 'Dr. Mary',
        lastName: 'Wambui',
        email: 'mary.wambui@knh.co.ke',
        phone: '+254 745 678 901',
        specialization: 'Pediatrics',
        licenseNumber: 'KMPDB789012',
        isAvailable: true,
      },
    ]).returning();

    // Insert test appointments
    await db.insert(appointments).values([
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        appointmentDate: new Date('2024-03-20T10:00:00'),
        status: 'scheduled',
        notes: 'Follow-up for diabetes management',
      },
      {
        patientId: patient2.id,
        doctorId: doctor2.id,
        appointmentDate: new Date('2024-03-21T14:30:00'),
        status: 'scheduled',
        notes: 'Child vaccination schedule',
      },
    ]);

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