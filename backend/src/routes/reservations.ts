import { Router, Response } from 'express';
import { z } from 'zod';
import { verifyJWT, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendPushToUser } from '../lib/push';

const router = Router();

// GET /reservations?date=YYYY-MM-DD
router.get('/', verifyJWT, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const where = date ? { date: new Date(date as string) } : {};
  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      plaza: { select: { id: true, num: true, floor: true, bay: true } },
      user:  { select: { id: true, name: true, avatarColor: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(reservations);
});

// GET /reservations/my/weekly?date=YYYY-MM-DD — cupo de la semana que contiene date
router.get('/my/weekly', verifyJWT, async (req: AuthRequest, res: Response) => {
  const ref = req.query.date ? new Date(req.query.date as string) : new Date();
  const day = ref.getDay() === 0 ? 7 : ref.getDay(); // 1=lun … 7=dom
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const count = await prisma.reservation.count({
    where: { userId: req.userId, date: { gte: monday, lte: sunday }, status: 'confirmed' },
  });
  const rules = await prisma.adminRules.findUniqueOrThrow({ where: { id: 1 } });
  res.json({ used: count, quota: rules.weeklyQuotaPerUser });
});

// POST /reservations
router.post('/', verifyJWT, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    liberationId: z.string(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const lib = await prisma.liberation.findUniqueOrThrow({
    where: { id: body.data.liberationId },
    include: { plaza: true, reservation: true },
  });

  if (lib.reservation) {
    if (lib.reservation.status === 'confirmed') {
      res.status(409).json({ error: 'Plaza ya reservada para ese día' }); return;
    }
    // Borrar reserva cancelada/displaced para poder crear una nueva
    await prisma.reservation.delete({ where: { id: lib.reservation.id } });
  }

  // Regla: antelación máxima
  const rules = await prisma.adminRules.findUniqueOrThrow({ where: { id: 1 } });
  const hoursAhead = (lib.date.getTime() - Date.now()) / 3_600_000;
  if (hoursAhead > rules.advanceBookingHours) {
    res.status(400).json({ error: `Solo puedes reservar con ${rules.advanceBookingHours}h de antelación` }); return;
  }

  // Regla: cupo semanal (próximos 7 días desde hoy)
  const from = new Date(); from.setHours(0,0,0,0);
  const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23,59,59,999);
  const weekCount = await prisma.reservation.count({
    where: { userId: req.userId, date: { gte: from, lte: to }, status: 'confirmed' },
  });
  if (weekCount >= rules.weeklyQuotaPerUser) {
    res.status(400).json({ error: 'Has alcanzado tu cupo semanal' }); return;
  }

  const reservation = await prisma.reservation.create({
    data: {
      plazaId:     lib.plazaId,
      userId:      req.userId!,
      liberationId: lib.id,
      date:        lib.date,
      halfDay:     lib.halfDay,
    },
    include: { plaza: true },
  });

  res.status(201).json(reservation);
});

// POST /reservations/urgent
router.post('/urgent', verifyJWT, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    liberationId: z.string(),
    reason:       z.string().min(10),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const rules = await prisma.adminRules.findUniqueOrThrow({ where: { id: 1 } });

  // Cupo mensual de urgentes
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const urgentCount = await prisma.reservation.count({
    where: { userId: req.userId, urgent: true, createdAt: { gte: startOfMonth } },
  });
  if (urgentCount >= rules.monthlyUrgentQuota) {
    res.status(400).json({ error: `Has usado todos tus urgentes del mes (${rules.monthlyUrgentQuota})` }); return;
  }

  const lib = await prisma.liberation.findUniqueOrThrow({
    where: { id: body.data.liberationId },
    include: { reservation: { include: { user: true } } },
  });

  const existing = lib.reservation;
  // Solo puede desplazar a usuarios floating (sin plaza fija)
  if (existing && existing.user.role !== 'floating') {
    res.status(400).json({ error: 'Solo puedes desplazar a usuarios sin plaza fija' }); return;
  }

  // Desplazar reserva existente si la hay
  if (existing) {
    await prisma.reservation.update({ where: { id: existing.id }, data: { status: 'displaced' } });
    await sendPushToUser(existing.userId, {
      title: '⚠️ Tu reserva fue desplazada',
      body: `Tu plaza (${lib.date.toLocaleDateString('es-ES')}) fue tomada por reserva urgente.`,
      url: '/reservar',
    });
  }

  const reservation = await prisma.reservation.create({
    data: {
      plazaId:      lib.plazaId,
      userId:       req.userId!,
      liberationId: lib.id,
      date:         lib.date,
      halfDay:      lib.halfDay,
      urgent:       true,
      reason:       body.data.reason,
    },
    include: { plaza: true },
  });

  await prisma.auditLog.create({
    data: { userId: req.userId, action: 'reservation_urgent', detail: `Plaza ${lib.plazaId} · ${lib.date.toISOString().slice(0,10)}` },
  });

  res.status(201).json(reservation);
});

// DELETE /reservations/:id
router.delete('/:id', verifyJWT, async (req: AuthRequest, res: Response) => {
  const res_ = await prisma.reservation.findUniqueOrThrow({ where: { id: req.params.id } });
  if (res_.userId !== req.userId) {
    res.status(403).json({ error: 'No puedes cancelar esta reserva' }); return;
  }
  await prisma.reservation.delete({ where: { id: req.params.id } });
  res.json({ message: 'Reserva cancelada' });
});

export default router;
