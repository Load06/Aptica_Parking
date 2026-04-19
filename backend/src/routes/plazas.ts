import { Router, Response } from 'express';
import { verifyJWT, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /plazas?floor=P-1|P-2&date=YYYY-MM-DD
router.get('/', verifyJWT, async (req: AuthRequest, res: Response) => {
  const { floor, date } = req.query;
  const where = floor ? { floor: floor as string } : {};

  const plazas = await prisma.plaza.findMany({
    where,
    include: {
      assignedUsers: { select: { id: true, name: true, avatarColor: true } },
      liberations: date
        ? { where: { date: new Date(date as string) }, include: { reservation: { select: { id: true, userId: true, status: true } } } }
        : false,
    },
    orderBy: [{ floor: 'asc' }, { bay: 'asc' }, { row: 'asc' }],
  });

  res.json(plazas);
});

// GET /plazas/availability?date=YYYY-MM-DD
router.get('/availability', verifyJWT, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  if (!date) { res.status(400).json({ error: 'date requerido' }); return; }

  const targetDate = new Date(date as string);
  const liberations = await prisma.liberation.findMany({
    where: { date: targetDate },
    include: {
      plaza: { include: { assignedUsers: { select: { id: true, name: true, avatarColor: true } } } },
      reservation: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  res.json(liberations);
});

export default router;
