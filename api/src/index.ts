import express, { json, urlencoded } from "express";
import cors from 'cors';
import { swaggerSpec } from './docs/swagger';
import swaggerUi from 'swagger-ui-express';
import patientsRouter from "./routes/patients/index";
import doctorsRouter from "./routes/doctors/index";
import appointmentsRouter from "./routes/appointments/index";
import recordsRouter from "./routes/records/index";
import statsRouter from "./routes/stats/index";
import './db';  // This will initialize the database connection
import { config } from 'dotenv';
import authRouter from "./routes/auth/index";
config();


const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(urlencoded({ extended: true }));
app.use(json());

app.get('/', (req, res) => {
    res.send(`
    <ul>
        <li><a href="/api-docs">API Documentation</a></li>
        <li><a href="/health">Health Check</a></li>
    </ul>
    `);
});
app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

app.use('/patients', patientsRouter);
app.use('/doctors', doctorsRouter);
app.use('/appointments', appointmentsRouter);
app.use('/records', recordsRouter);
app.use('/stats', statsRouter);
app.use('/auth', authRouter);

app.listen(port, () => {
    // console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
});