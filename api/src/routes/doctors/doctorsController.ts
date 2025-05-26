import { Request, Response } from 'express';

export function getDoctors(req: Request, res: Response) {
    res.send('Get Doctors');
};

export function addDoctor(req: Request, res: Response) {
    res.send('Add Doctor');
};

export function updateDoctor(req: Request, res: Response) {
    res.send('Update Doctor');
};


// Doctor Management
// Endpoints:

// POST /doctors – Add a new doctor.

// GET /doctors/:id – View doctor profile.

// PUT /doctors/:id – Edit profile/schedule.

// Data Fields:

// Name, Specialty, Contact

// Schedule availability (e.g. Mon–Fri, 9 AM–5 PM)

// Availability Model:

// Store time blocks available for appointments.
