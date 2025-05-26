import express, { json, urlencoded } from "express";
import patientsRouter from "./routes/patients/index";
import doctorsRouter from "./routes/doctors/index";
import appointmentsRouter from "./routes/appointments/index";
import recordsRouter from "./routes/records/index";
import statsRouter from "./routes/stats/index";
import './db';  // This will initialize the database connection
import { config } from 'dotenv';
config();

const port = process.env.PORT || 3000;

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/patients', patientsRouter);
app.use('/doctors', doctorsRouter);
app.use('/appointments', appointmentsRouter);
app.use('/records', recordsRouter);
app.use('/stats', statsRouter);

app.listen(port, () => {
    // console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
});