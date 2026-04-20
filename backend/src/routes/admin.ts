import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { verifyJWT, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendPushToUser } from '../lib/push';

const router = Router();
router.use(verifyJWT, requireRole('admin'));

// GET /admin/users
router.get('/users', async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, phone: true, plate: true,
      role: true, status: true, priority: true, avatarColor: true,
      assignedPlaza: { select: { id: true, num: true, floor: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

// POST /admin/users  (crear usuario directamente)
router.post('/users', async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name:           z.string().min(2),
    email:          z.string().email(),
    role:           z.enum(['fixed', 'floating', 'admin', 'guest']),
    assignedPlazaId: z.string().optional(),
    plate:          z.string().optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const user = await prisma.user.create({
    data: { ...body.data, status: body.data.role === 'fixed' ? 'invited' : 'active' },
  });
  await prisma.auditLog.create({ data: { userId: req.userId, action: 'user_created', detail: user.email } });
  res.status(201).json(user);
});

// PUT /admin/users/:id
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name:            z.string().optional(),
    role:            z.enum(['fixed', 'floating', 'admin', 'guest']).optional(),
    status:          z.enum(['invited', 'pending', 'active', 'disabled']).optional(),
    priority:        z.boolean().optional(),
    assignedPlazaId: z.string().nullable().optional(),
    plate:           z.string().optional(),
    phone:           z.string().optional(),
    avatarColor:     z.string().optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const user = await prisma.user.update({ where: { id: req.params.id }, data: body.data });
  res.json(user);
});

// POST /admin/users/:id/approve
router.post('/users/:id/approve', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'active' },
  });
  await prisma.auditLog.create({ data: { userId: req.userId, action: 'user_approved', detail: user.email } });
  await sendPushToUser(user.id, {
    title: '✅ Acceso activado',
    body: 'Tu cuenta de Aptica Parking ha sido activada.',
    url: '/',
  });
  res.json({ message: 'Usuario activado' });
});

// POST /admin/users/:id/reset-password — genera token y devuelve el enlace al admin
router.post('/users/:id/reset-password', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id } });
  const token = crypto.randomBytes(32).toString('hex');
  const exp   = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExp: exp } });
  await prisma.auditLog.create({ data: { userId: req.userId, action: 'password_reset_sent', detail: user.email } });
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  res.json({ url });
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  if (targetId === req.userId) {
    return res.status(403).json({ error: 'No puedes eliminarte a ti mismo' });
  }
  const adminCount = await prisma.user.count({ where: { role: 'admin' } });
  const targetUser = await prisma.user.findUniqueOrThrow({ where: { id: targetId }, select: { role: true } });
  if (targetUser.role === 'admin' && adminCount <= 1) {
    return res.status(403).json({ error: 'No se puede eliminar el único administrador' });
  }
  // 1. Delete reservations made by this user
  await prisma.reservation.deleteMany({ where: { userId: targetId } });
  // 2. Delete reservations on liberations owned by this user (other users reserved them)
  const userLiberations = await prisma.liberation.findMany({ where: { userId: targetId }, select: { id: true } });
  if (userLiberations.length > 0) {
    await prisma.reservation.deleteMany({ where: { liberationId: { in: userLiberations.map(l => l.id) } } });
  }
  // 3. Delete liberations
  await prisma.liberation.deleteMany({ where: { userId: targetId } });
  // 4. Nullify audit log entries (userId is optional)
  await prisma.auditLog.updateMany({ where: { userId: targetId }, data: { userId: null } });
  // 5. Delete user (PushSubscription + WaitingQueue cascade automatically)
  const user = await prisma.user.delete({ where: { id: targetId } });
  await prisma.auditLog.create({ data: { userId: req.userId, action: 'user_deleted', detail: user.email } });
  res.json({ message: 'Usuario eliminado' });
});

// GET /admin/rules
router.get('/rules', async (_req, res: Response) => {
  const rules = await prisma.adminRules.findUniqueOrThrow({ where: { id: 1 } });
  res.json(rules);
});

// PUT /admin/rules
router.put('/rules', async (req: AuthRequest, res: Response) => {
  const body = z.object({
    advanceBookingHours:  z.number().int().min(1).optional(),
    weeklyQuotaPerUser:   z.number().int().min(1).optional(),
    monthlyUrgentQuota:   z.number().int().min(0).optional(),
    notifyOnLiberation:   z.boolean().optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const rules = await prisma.adminRules.update({ where: { id: 1 }, data: body.data });
  await prisma.auditLog.create({ data: { userId: req.userId, action: 'rules_updated', detail: JSON.stringify(body.data) } });
  res.json(rules);
});

// GET /admin/audit-log
router.get('/audit-log', async (_req, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(logs);
});

export default router;
