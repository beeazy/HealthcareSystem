import { Request, Response } from 'express';

export function getPatients(req: Request, res: Response) {
    res.send('Get Patients');
};

export function addPatient(req: Request, res: Response) {
    res.send('Add Patient');
};

export function updatePatient(req: Request, res: Response) {
    res.send('Update Patient');
};

export function deletePatient(req: Request, res: Response) {
    res.send('Delete Patient');
};


// Patient Management
// Endpoints:

// POST /patients – Register a new patient.

// GET /patients/:id – Retrieve patient profile.

// PUT /patients/:id – Update patient details.

// DELETE /patients/:id – Soft-delete or deactivate a patient.

// Data Fields:

// Full name, Date of birth, Gender, Contact info

// Patient ID (auto-generated)

// Insurance provider, insurance number

// Security:

// Basic authentication + authorization.