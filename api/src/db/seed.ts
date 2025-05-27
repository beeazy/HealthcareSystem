import { db } from './index';
import { patients, doctors, appointments, medicalRecords } from './schema';

async function seed() {
  try {
    // Clear existing data
    // await db.delete(medicalRecords);
    // await db.delete(appointments);
    // await db.delete(doctors);
    // await db.delete(patients);

    // Insert test patients
    const [patient1, patient2, patient3, patient4, patient5] = await db.insert(patients).values([
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
      {
        fullName: 'John Doe',
        dateOfBirth: new Date('1978-12-05'),
        gender: 'male',
        contactInfo: '0722334456',
        insuranceProvider: 'SHIF',
        insuranceNumber: '9876543210',
      },
      {
        fullName: 'Jane Smith',
        dateOfBirth: new Date('1995-08-15'),
        gender: 'female',
        contactInfo: '0722334457',
        insuranceProvider: 'CIC',
        insuranceNumber: '4567891230',
      },
      {
        fullName: 'Peter Parker',
        dateOfBirth: new Date('1988-04-25'),
        gender: 'male',
        contactInfo: '0722334458',
        insuranceProvider: 'Britam',
        insuranceNumber: '7891234560',
      }
    ]).returning();

    // Insert test doctors with different specializations and availability
    const [doctor1, doctor2, doctor3, doctor4, doctor5] = await db.insert(doctors).values([
      {
        firstName: 'Dr. James',
        lastName: 'Ochieng',
        email: 'james.ochieng@knh.co.ke',
        phone: '+254 734 567 890',
        specialization: 'Internal Medicine',
        licenseNumber: 'KMPDB123456',
        isAvailable: true,
        isActive: true,
      },
      {
        firstName: 'Dr. Mary',
        lastName: 'Wambui',
        email: 'mary.wambui@knh.co.ke',
        phone: '+254 745 678 901',
        specialization: 'Pediatrics',
        licenseNumber: 'KMPDB789012',
        isAvailable: true,
        isActive: true,
      },
      {
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@knh.co.ke',
        phone: '+254 756 789 012',
        specialization: 'Cardiology',
        licenseNumber: 'KMPDB345678',
        isAvailable: false,
        isActive: true,
      },
      {
        firstName: 'Dr. Michael',
        lastName: 'Chen',
        email: 'michael.chen@knh.co.ke',
        phone: '+254 767 890 123',
        specialization: 'Neurology',
        licenseNumber: 'KMPDB901234',
        isAvailable: true,
        isActive: true,
      },
      {
        firstName: 'Dr. Lisa',
        lastName: 'Wang',
        email: 'lisa.wang@knh.co.ke',
        phone: '+254 778 901 234',
        specialization: 'Pediatrics',
        licenseNumber: 'KMPDB567890',
        isAvailable: true,
        isActive: false,
      }
    ]).returning();

    // Insert test appointments across different dates
    // const today = new Date();
    // const appointmentsData = [
    //   {
    //     patientId: patient1.id,
    //     doctorId: doctor1.id,
    //     appointmentDate: new Date(today.setHours(10, 0, 0, 0)),
    //     status: 'scheduled',
    //     notes: 'Follow-up for diabetes management',
    //   },
    //   {
    //     patientId: patient2.id,
    //     doctorId: doctor2.id,
    //     appointmentDate: new Date(today.setHours(14, 30, 0, 0)),
    //     status: 'scheduled',
    //     notes: 'Child vaccination schedule',
    //   },
    //   {
    //     patientId: patient3.id,
    //     doctorId: doctor3.id,
    //     appointmentDate: new Date(today.setDate(today.getDate() + 1)),
    //     status: 'scheduled',
    //     notes: 'Cardiac consultation',
    //   },
    //   {
    //     patientId: patient4.id,
    //     doctorId: doctor4.id,
    //     appointmentDate: new Date(today.setDate(today.getDate() + 2)),
    //     status: 'scheduled',
    //     notes: 'Neurological assessment',
    //   },
    //   {
    //     patientId: patient5.id,
    //     doctorId: doctor5.id,
    //     appointmentDate: new Date(today.setDate(today.getDate() - 1)),
    //     status: 'completed',
    //     notes: 'Regular checkup',
    //   }
    // ];

    // await db.insert(appointments).values(appointmentsData);

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