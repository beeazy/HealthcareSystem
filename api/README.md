# Healthcare System API

A healthcare management system API built with Express.js, TypeScript, and PostgreSQL.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```env
DATABASE_URL="postgresql://localhost:5432/healthcare_db"
PORT=3000
NODE_ENV=development
```

3. Create and setup database:
```bash
# Create database
createdb healthcare_db

# Generate and run migrations
npm run generate
npm run migrate

# Add test data
npm run seed
```

4. Start the server:
```bash
npm run dev
```

## Available Commands

- `npm run dev` - Start development server
- `npm run generate` - Generate database migrations
- `npm run migrate` - Run database migrations
- `npm run seed` - Add test data
- `npm run studio` - Open database management UI

## API Endpoints

### Patients
- `GET /patients` - Get all patients
- `GET /patients/:id` - Get patient by ID
- `POST /patients` - Create new patient
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Doctors
- `GET /doctors` - Get all doctors
- `GET /doctors/:id` - Get doctor by ID
- `POST /doctors` - Create new doctor
- `PUT /doctors/:id` - Update doctor
- `DELETE /doctors/:id` - Delete doctor

### Appointments
- `GET /appointments` - Get all appointments
- `GET /appointments/:id` - Get appointment by ID
- `POST /appointments` - Create new appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment

### Medical Records
- `GET /medical-records` - Get all medical records
- `GET /medical-records/:id` - Get medical record by ID
- `POST /medical-records` - Create new medical record
- `PUT /medical-records/:id` - Update medical record
- `DELETE /medical-records/:id` - Delete medical record

### Stats
- `GET /stats` - Get system statistics

## Features

- Patient management
- Doctor management
- Appointment scheduling
- Medical records tracking
- RESTful API endpoints
- TypeScript for type safety
- PostgreSQL database with Drizzle ORM
- Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup

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

4. Create a `.env` file in the root directory with the following configuration:
```env
# Database Configuration
DATABASE_URL="postgresql://localhost:5432/healthcare_db"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

5. Generate and apply database migrations:
```bash
# Generate migration files
npm run generate

# Apply migrations to the database
npm run migrate
```

6. Seed the database with test data:
```bash
npm run seed
```

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run generate` - Generate database migration files
- `npm run migrate` - Apply database migrations
- `npm run seed` - Seed the database with test data
- `npm run studio` - Open Drizzle Studio to manage database

## Database Schema

The system includes the following main entities:

### Patients
- Basic information (name, email, phone)
- Date of birth
- Gender
- Medical history

### Doctors
- Basic information (name, email, phone)
- Specialization
- License number
- Availability status

### Appointments
- Patient and doctor references
- Appointment date and time
- Status
- Notes

### Medical Records
- Patient and doctor references
- Diagnosis
- Prescription
- Notes

## Development

The project uses:
- TypeScript for type safety
- Express.js for the API framework
- Drizzle ORM for database operations
- PostgreSQL as the database
- Environment variables for configuration

## Project Structure

```
src/
├── db/
│   ├── index.ts      # Database connection
│   ├── schema.ts     # Database schema
│   └── seed.ts       # Seed data
├── routes/
│   └── stats/        # Stats endpoints
└── index.ts          # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 