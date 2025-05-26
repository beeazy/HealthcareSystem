import { Request, Response } from 'express';

export function addMedicalRecord(req: Request, res: Response) {
    res.send('Add Medical Record');
};

export function viewSpecificMedicalRecord(req: Request, res: Response) {
    res.send('View Specific Medical Record');
};

export function viewAllRecordsForAPatient(req: Request, res: Response) {
    res.send('View All Records for a Patient');
};


// Medical Records
// Endpoints:

// POST /records – Add medical record for a patient.

// GET /records/:id – View specific medical record.

// GET /patients/:id/records – View all records for a patient.

// Data Fields:

// Diagnosis, notes, prescriptions, linked to appointment ID.

// Security:

// Role-based access (e.g. only assigned doctor and patient can view).