import { Router } from "express";

const router = Router();

router.get('/', (req, res) => {
    res.send('Get Doctors');
});

router.post('/', (req, res) => {
    res.send('Add Doctor');
});

router.put('/:id', (req, res) => {
    res.send('Update Doctor');
});

router.delete('/:id', (req, res) => {
    res.send('Delete Doctor');
});

export default router;