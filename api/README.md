# Healthcare System API

A healthcare management system API built with Express.js, TypeScript, and PostgreSQL.

## Table of Contents
- [System Overview](#system-overview)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Sequence Diagrams](#sequence-diagrams)

## System Overview

This healthcare system provides core functionality for appointment scheduling and patient management. The system is designed with simplicity and security in mind.

### Core Features
1. **User Management**
   - Automatic patient registration for new users
   - Admin-controlled doctor account creation
   - Role-based access control (patient, doctor, admin)

2. **Appointment Scheduling**
   - Book appointments with available doctors
   - Prevent scheduling conflicts
   - Track appointment status
   - Manage doctor availability

3. **Patient Management**
   - Store basic patient information
   - Track insurance details
   - View appointment history

4. **Doctor Management**
   - Maintain doctor profiles
   - Track specializations
   - Manage availability

5. **Medical Records** (Optional)
   - Store patient medical history
   - Link records to appointments
   - Secure access control

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd healthcare-system/api
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```bash
createdb healthcare_db
```

4. Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL="postgresql://localhost:5432/healthcare_db"

# Admin Configuration
ADMIN_CREATION_KEY="admin_user_creation_key"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET="secret-jwt-key"
JWT_EXPIRES_IN="24h"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

5. Initialize the database:
```bash
# Generate migration files
npm run generate

# Apply migrations
npm run migrate

# Seed test data
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication
All API endpoints except `/auth/login` and `/auth/register` require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication
- `POST /auth/register`
  - Request body: `{ email: string, password: string, firstName: string, lastName: string }`
  - Response: `{ token: string, user: User }`
  - Note: Creates a patient account by default

- `POST /auth/login`
  - Request body: `{ email: string, password: string }`
  - Response: `{ token: string, user: User }`

#### Users
- `GET /users/me`
  - Response: `User`

- `PUT /users/me`
  - Request body: `UserUpdate`
  - Response: `User`

#### Doctors (Admin Only)
- `POST /doctors`
  - Request body: `DoctorCreate`
  - Response: `Doctor`

- `GET /doctors`
  - Query params: `page`, `limit`, `search`, `specialization`
  - Response: `{ doctors: Doctor[], total: number }`

- `PUT /doctors/:id`
  - Request body: `DoctorUpdate`
  - Response: `Doctor`

#### Appointments
- `GET /appointments`
  - Query params: `page`, `limit`, `status`, `date`
  - Response: `{ appointments: Appointment[], total: number }`

- `POST /appointments`
  - Request body: `AppointmentCreate`
  - Response: `Appointment`

- `PUT /appointments/:id`
  - Request body: `AppointmentUpdate`
  - Response: `Appointment`

#### Medical Records (Optional)
- `GET /medical-records`
  - Query params: `page`, `limit`
  - Response: `{ records: MedicalRecord[], total: number }`

- `POST /medical-records`
  - Request body: `MedicalRecordCreate`
  - Response: `MedicalRecord`

## Database Schema

```mermaid
erDiagram
    users {
        int id PK
        string email
        string password
        string fullName
        enum role
        string phone
        timestamp createdAt
        timestamp updatedAt
    }

    doctor_profiles {
        int id PK
        int userId FK
        string specialization
        string licenseNumber
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }

    patient_profiles {
        int id PK
        int userId FK
        string dateOfBirth
        string gender
        string insuranceProvider
        string insuranceNumber
        timestamp createdAt
        timestamp updatedAt
    }

    appointments {
        int id PK
        int patientId FK
        int doctorId FK
        timestamp appointmentDate
        enum status
        text notes
        timestamp createdAt
        timestamp updatedAt
    }

    medical_records {
        int id PK
        int patientId FK
        int doctorId FK
        int appointmentId FK
        text diagnosis
        text prescription
        text notes
        timestamp createdAt
        timestamp updatedAt
    }

    users ||--o| doctor_profiles : "has"
    users ||--o| patient_profiles : "has"
    users ||--o{ appointments : "books"
    users ||--o{ medical_records : "has"
    appointments ||--o{ medical_records : "has"
```

### Schema Notes
- Users table is the single source of truth for all user types (patients, doctors, admins)
- Doctor availability is determined by appointment scheduling, not a static flag
- Doctor profiles have an isActive flag for admin-controlled deactivation
- Patient profiles store insurance information for NHIF and private insurance tracking
- All timestamps are in UTC

## Sequence Diagrams

### User Registration Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database

    C->>A: POST /auth/register
    A->>D: Create user (role: patient)
    D-->>A: User created
    A->>D: Create patient profile
    D-->>A: Profile created
    A-->>C: User with token
```

### Appointment Booking Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database

    C->>A: POST /appointments
    A->>D: Check doctor availability
    D-->>A: Availability status
    A->>D: Create appointment
    D-->>A: Appointment created
    A-->>C: Appointment details
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run generate` - Generate database migration files
- `npm run migrate` - Apply database migrations
- `npm run seed` - Seed database with test data
- `npm run studio` - Open Drizzle Studio for database management