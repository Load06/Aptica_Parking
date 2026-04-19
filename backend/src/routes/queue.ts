import { Router, Response } from 'express';
import { z } from 'zod';
import { verifyJWT, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /queue — unirse a la cola para una fecha
router.post('/', verifyJWT, async (req: AuthRequest, res: Response) => {
  const body = z.object({ date: z.string() }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const date = new Date(body.data.date);

  // Validar: no tiene ya reserva confirmada ese día
  const existingReservation = await prisma.reservation.findFirst({
    where: { userId: req.userId!, date, status: 'confirmed' },
  });
  if (existingReservation) {
    res.status(409).json({ error: 'Ya tienes una reserva para este día' }); return;
  }

  // Validar: no está ya en la cola para ese día
  const existingQueue = await prisma.waitingQueue.findUnique({
    where: { userId_date: { userId: req.userId!, date } },
  });
  if (existingQueue) {
    res.status(409).json({ error: 'Ya estás en la cola para este día' }); return;
  }

  // Calcular posición
  const last = await prisma.waitingQueue.findFirst({
    where: { date },
    orderBy: { position: 'desc' },
  });
  const position = (last?.position ?? 0) + 1;

  const entry = await prisma.waitingQueue.create({
    data: { userId: req.userId!, date, position },
  });

  res.status(201).json({ id: entry.id, position: entry.position });
});

// DELETE /queue/:id — salir de la cola
router.delete('/:id', verifyJWT, async (req: AuthRequest, res: Response) => {
  const entry = await prisma.waitingQueue.findUniqueOrThrow({ where: { id: req.params.id } });
  if (entry.userId !== req.userId) {
    res.status(403).json({ error: 'No puedes salir de la cola de otro usuario' }); return;
  }
  await prisma.waitingQueue.delete({ where: { id: req.params.id } });
  res.json({ message: 'Saliste de la cola' });
});

// GET /queue?date=YYYY-MM-DD
router.get('/', verifyJWT, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  if (!date) { res.status(400).json({ error: 'date requerido' }); return; }

  const targetDate = new Date(date as string);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  if (user.role === 'admin') {
    const entries = await prisma.waitingQueue.findMany({
      where: { date: targetDate },
      include: { user: { select: { id: true, name: true, avatarColor: true } } },
      orderBy: { position: 'asc' },
    });
    res.json(entries);
    return;
  }

  const entry = await prisma.waitingQueue.findUnique({
    where: { userId_date: { userId: req.userId!, date: targetDate } },
  });

  res.json({
    inQueue: !!entry,
    position: entry?.position ?? null,
    id: entry?.id ?? null,
  });
});

export default router;
