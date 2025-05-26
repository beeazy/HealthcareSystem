import express from "express";
import patientsRouter from "./routes/patients/index";
import doctorsRouter from "./routes/doctors/index";
import appointmentsRouter from "./routes/appointments/index";
import recordsRouter from "./routes/records/index";
const port = 3000;

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/patients', patientsRouter);
app.use('/doctors', doctorsRouter);
app.use('/appointments', appointmentsRouter);
app.use('/records', recordsRouter);

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});