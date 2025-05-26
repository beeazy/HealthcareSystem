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
