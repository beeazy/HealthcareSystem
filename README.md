# Healthcare System

A modern healthcare management system built with Next.js and Node.js, featuring role-based access control, appointment scheduling, and patient management.

## Project Structure

The project is divided into two main directories:

### `/api` - Backend Server
- Built with Node.js and Express
- Uses Drizzle ORM for database operations
- Implements RESTful API endpoints for:
  - Authentication and authorization
  - Patient management
  - Doctor management
  - Appointment scheduling
  - Statistics and reporting
- Features role-based access control (Admin, Doctor, Patient)
- Implements validation using Zod schemas
- Handles business logic for:
  - Appointment scheduling and validation
  - Doctor availability checks
  - Time slot management
  - Patient record management

### `/front-end` - Next.js Application
- Built with Next.js 14 and TypeScript
- Uses modern React patterns and hooks
- Features a responsive UI built with shadcn/ui components
- Implements client-side validation using Zod
- Key features:
  - Role-based access control
  - Real-time appointment scheduling
  - Patient and doctor management
  - Interactive dashboard with statistics
  - Form validation and error handling
  - Responsive design for all devices

## Key Features

- **Authentication & Authorization**
  - Secure login and registration
  - Role-based access control
  - Protected routes and API endpoints

- **Appointment Management**
  - Schedule, update, and cancel appointments
  - Real-time availability checking
  - Conflict prevention
  - Status tracking (scheduled, completed, cancelled)

- **Patient Management**
  - Patient registration and profiles
  - Medical history tracking
  - Insurance information management
  - Appointment history

- **Doctor Management**
  - Doctor profiles and specializations
  - Availability management
  - Appointment scheduling
  - Patient assignment

- **Dashboard & Analytics**
  - Real-time statistics
  - Appointment overview
  - Patient and doctor metrics
  - Specialization analysis

## Technology Stack

### Backend
- Node.js & Express
- Drizzle ORM
- PostgreSQL
- Zod for validation
- JWT for authentication

### Frontend
- Next.js 14
- TypeScript
- React Hook Form
- Zod for validation
- shadcn/ui components
- Tailwind CSS
- Zustand for state management

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd api
   npm install

   # Install frontend dependencies
   cd ../front-end
   npm install
   ```

3. Set up environment variables:
   - Create `.env` files in both `/api` and `/front-end` directories
   - Configure database connection, JWT secret, and other required variables

4. Start the development servers:
   ```bash
   # Start backend server
   cd api
   npm run dev

   # Start frontend server
   cd ../front-end
   npm run dev
   ```

## API Documentation

The API provides the following main endpoints:

- `/auth` - Authentication endpoints
- `/patients` - Patient management
- `/doctors` - Doctor management
- `/appointments` - Appointment scheduling
- `/stats` - System statistics

Detailed API documentation is available in the `/api` directory.