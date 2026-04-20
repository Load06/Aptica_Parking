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

  const succeededResults = created.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<{ id: string; date: Date; plazaId: string; userId: string; halfDay: string; recurrenceId: string | null; createdAt: Date }>[];
  const succeeded = succeededResults.length;

  await prisma.auditLog.create({
    data: { userId: req.userId, action: 'plaza_liberated', detail: `${plazaId} × ${succeeded} días` },
  });

  // Para cada liberación creada, intentar auto-asignar desde la cola
  const rules = await prisma.adminRules.findUniqueOrThrow({ where: { id: 1 } });
  let assignedCount = 0;

  for (const result of succeededResults) {
    const lib = result.value;
    const libDate = lib.date;

    // Primero: intentar asignar a un usuario prioritario (floating con priority=true)
    const priorityUsers = await prisma.user.findMany({
      where: { priority: true, role: 'floating', status: 'active' },
    });

    let assigned = false;
    for (const pUser of priorityUsers) {
      const existingRes = await prisma.reservation.findFirst({
        where: { userId: pUser.id, date: libDate, status: 'confirmed' },
      });
      if (existingRes) continue;

      const ref = new Date(libDate);
      const day = ref.getDay() === 0 ? 7 : ref.getDay();
      const monday = new Date(ref); monday.setDate(ref.getDate() - (day - 1)); monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
      const weekCount = await prisma.reservation.count({
        where: { userId: pUser.id, date: { gte: monday, lte: sunday }, status: 'confirmed' },
      });
      if (weekCount >= rules.weeklyQuotaPerUser) continue;

      await prisma.reservation.create({
        data: {
          plazaId:      lib.plazaId,
          userId:       pUser.id,
          liberationId: lib.id,
          date:         libDate,
          halfDay:      lib.halfDay as never,
        },
      });
      await sendPushToUser(pUser.id, {
        title: '🎉 Te hemos asignado una plaza',
        body: `Plaza ${plaza.num} (${plaza.floor}) reservada automáticamente para ti.`,
        url: '/',
      });
      assigned = true;
      assignedCount++;
      break;
    }

    if (assigned) continue;

    // Segundo: intentar asignar desde la cola
    const queueEntries = await prisma.waitingQueue.findMany({
      where: { date: libDate },
      orderBy: { position: 'asc' },
    });

    for (const entry of queueEntries) {
      // Verificar elegibilidad: sin reserva confirmada ese día
      const existingRes = await prisma.reservation.findFirst({
        where: { userId: entry.userId, date: libDate, status: 'confirmed' },
      });
      if (existingRes) continue;

      // Verificar cupo semanal (los usuarios fijos están exentos)
      const queueUser = await prisma.user.findUnique({ where: { id: entry.userId } });
      if (queueUser?.role !== 'fixed') {
        const ref = new Date(libDate);
        const day = ref.getDay() === 0 ? 7 : ref.getDay();
        const monday = new Date(ref); monday.setDate(ref.getDate() - (day - 1)); monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
        const weekCount = await prisma.reservation.count({
          where: { userId: entry.userId, date: { gte: monday, lte: sunday }, status: 'confirmed' },
        });
        if (weekCount >= rules.weeklyQuotaPerUser) continue;
      }

      // Elegible → crear reserva y eliminar de la cola
      await prisma.reservation.create({
        data: {
          plazaId:      lib.plazaId,
          userId:       entry.userId,
          liberationId: lib.id,
          date:         libDate,
          halfDay:      lib.halfDay as never,
        },
      });
      await prisma.waitingQueue.delete({ where: { id: entry.id } });
      await sendPushToUser(entry.userId, {
        title: '🎉 Te hemos asignado una plaza',
        body: `Plaza ${plaza.num} (${plaza.floor}) reservada automáticamente para ti.`,
        url: '/',
      });
      assigned = true;
      assignedCount++;
      break;
    }

    // Si nadie en cola era elegible, notificar a todos los floating
    if (!assigned) {
      await sendPushToRole('floating', {
        title: '🚗 Nueva plaza disponible',
        body: `${user.name} liberó la plaza ${plaza.num} (${plaza.floor})`,
        url: '/',
      });
    }
  }

  res.status(201).json({ created: succeeded, assigned: assignedCount });
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
