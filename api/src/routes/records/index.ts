import { Router } from "express";

const router = Router();

router.post('/', (req, res) => {
    res.send('Add Medical Record');
});

router.get('/:id', (req, res) => {
    res.send('View Specific Medical Record');
});

router.get('/patients/:id/records', (req, res) => {
    res.send('View All Records for a Patient');
});

export default router;