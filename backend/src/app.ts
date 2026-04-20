import express from 'express';
import cors from 'cors';

import authRouter         from './routes/auth';
import plazasRouter       from './routes/plazas';
import liberationsRouter  from './routes/liberations';
import reservationsRouter from './routes/reservations';
import adminRouter        from './routes/admin';
import pushRouter         from './routes/push';
import queueRouter        from './routes/queue';
import { verifyJWT }      from './middleware/auth';
import { prisma }         from './lib/prisma';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

app.use('/auth',         authRouter);
app.use('/plazas',       plazasRouter);
app.use('/liberations',  liberationsRouter);
app.use('/reservations', reservationsRouter);
app.use('/admin',        adminRouter);
app.use('/push',         pushRouter);
app.use('/queue',        queueRouter);

app.get('/rules', verifyJWT, async (_req, res) => {
  const rules = await prisma.adminRules.findUniqueOrThrow({ where: { id: 1 } });
  res.json(rules);
});

app.get('/health', (_req, res) => res.json({ ok: true }));

export default app;
