import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter         from './routes/auth';
import plazasRouter       from './routes/plazas';
import liberationsRouter  from './routes/liberations';
import reservationsRouter from './routes/reservations';
import adminRouter        from './routes/admin';
import pushRouter         from './routes/push';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

app.use('/auth',         authRouter);
app.use('/plazas',       plazasRouter);
app.use('/liberations',  liberationsRouter);
app.use('/reservations', reservationsRouter);
app.use('/admin',        adminRouter);
app.use('/push',         pushRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend listening on port ${PORT}`));
