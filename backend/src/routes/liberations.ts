import { Router, Response } from 'express';
import { z } from 'zod';
import { verifyJWT, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendPushToRole, sendPushToUser } from '../lib/push';

const router = Router();

// POST /liberations
router.post('/', verifyJWT, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    plazaId:     z.string(),
    dates:       z.array(z.string()),   // YYYY-MM-DD[]
    halfDay:     z.enum(['full', 'am', 'pm']).default('full'),
    // Modo recurrente
    recurrent:   z.boolean().optional(),
    weekday:     z.number().min(0).max(6).optional(), // 0=lun
    until:       z.string().optional(),               // YYYY-MM-DD
  }).safeParse(req.body);

  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const { plazaId, dates, halfDay, recurrent, weekday, until } = body.data;

  // Verificar que el usuario es dueño (o co-dueño) de la plaza
  const plaza = await prisma.plaza.findUniqueOrThrow({
    where: { id: plazaId },
    include: { assignedUsers: { select: { id: true } } },
  });
  const isCoOwner = plaza.assignedUsers.some((c: { id: string }) => c.id === req.userId);

  // También se verifica por assignedPlazaId en el usuario
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (!isCoOwner) {
    res.status(403).json({ error: 'No eres titular de esta plaza' }); return;
  }

  const recurrenceId = recurrent ? `rec-${req.userId}-${Date.now()}` : undefined;

  // Build date list for recurrent mode
  let allDates = dates.map(d => new Date(d));
  if (recurrent && weekday !== undefined && until) {
    const end = new Date(until);
    const cur = new Date();
    while (cur <= end) {
      // 0=Mon in our system (getDay: 0=Sun,1=Mon...)
      const jsDay = (weekday + 1) % 7; // convert Mon=0 → JS Mon=1
      if (cur.getDay() === jsDay) {
        allDates.push(new Date(cur));
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  const created = await Promise.allSettled(
    allDates.map(date =>
      prisma.liberation.create({
        data: { plazaId, userId: req.userId!, date, halfDay, recurrenceId },
      })
    )
  );

  const succeeded = created.filter(r => r.status === 'fulfilled').length;

  await prisma.auditLog.create({
    data: { userId: req.userId, action: 'plaza_liberated', detail: `${plazaId} × ${succeeded} días` },
  });

  // Push notification a usuarios floating
  await sendPushToRole('floating', {
    title: '🚗 Nueva plaza disponible',
    body: `${user.name} liberó la plaza ${plaza.num} (${plaza.floor})`,
    url: '/reservar',
  });

  res.status(201).json({ created: succeeded });
});

// DELETE /liberations/:id
router.delete('/:id', verifyJWT, async (req: AuthRequest, res: Response) => {
  const lib = await prisma.liberation.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      reservation: true,
      plaza: { select: { num: true, floor: true } },
    },
  });

  if (lib.userId !== req.userId) {
    res.status(403).json({ error: 'No puedes cancelar esta liberación' }); return;
  }

  if (lib.reservation) {
    if (lib.reservation.status === 'confirmed') {
      await sendPushToUser(lib.reservation.userId, {
        title: '🔙 Plaza recuperada por su titular',
        body: `La plaza ${lib.plaza.num} (${lib.plaza.floor}) ha sido recuperada. Tu reserva ha sido cancelada.`,
        url: '/reservar',
      });
    }
    // Borrar reservation antes que liberation (FK constraint sin onDelete Cascade)
    await prisma.reservation.delete({ where: { id: lib.reservation.id } });
  }

  await prisma.liberation.delete({ where: { id: req.params.id } });
  res.json({ message: 'Liberación cancelada' });
});

// GET /liberations/my — liberaciones del usuario autenticado
router.get('/my', verifyJWT, async (req: AuthRequest, res: Response) => {
  const libs = await prisma.liberation.findMany({
    where: { userId: req.userId },
    include: { reservation: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { date: 'asc' },
  });
  res.json(libs);
});

export default router;
