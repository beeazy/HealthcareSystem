import { Router } from "express";

const router = Router();

router.get('/', (req, res) => {
    res.send('Get Patients');
});

router.post('/', (req, res) => {
    res.send('Add Patient');
});

router.put('/:id', (req, res) => {
    res.send('Update Patient');
});

router.delete('/:id', (req, res) => {
    res.send('Delete Patient');
});

export default router;