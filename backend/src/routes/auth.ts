import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendPasswordResetEmail } from '../lib/email';
import { verifyJWT, AuthRequest } from '../middleware/auth';

const router = Router();

function signAccess(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
}
function signRefresh(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const body = z.object({
    name:     z.string().min(2),
    email:    z.string().email(),
    password: z.string().min(8),
    plate:    z.string().optional(),
    phone:    z.string().optional(),
  }).safeParse(req.body);

  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }
  const { name, email, password, plate, phone } = body.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { res.status(409).json({ error: 'Email ya registrado' }); return; }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, plate, phone, role: 'floating', status: 'pending' },
  });

  await prisma.auditLog.create({ data: { userId: user.id, action: 'user_registered', detail: email } });
  res.status(201).json({ message: 'Registro recibido. El admin activará tu cuenta.' });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const body = z.object({ email: z.string().email(), password: z.string() }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: 'Datos inválidos' }); return; }

  const user = await prisma.user.findUnique({ where: { email: body.data.email } });
  if (!user || !user.passwordHash) { res.status(401).json({ error: 'Credenciales incorrectas' }); return; }
  if (user.status === 'pending')  { res.status(403).json({ error: 'Cuenta pendiente de aprobación' }); return; }
  if (user.status === 'invited')  { res.status(403).json({ error: 'Debes establecer tu contraseña primero' }); return; }
  if (user.status === 'disabled') { res.status(403).json({ error: 'Cuenta desactivada' }); return; }

  const valid = await bcrypt.compare(body.data.password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: 'Credenciales incorrectas' }); return; }

  const accessToken  = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  res.json({ accessToken, refreshToken });
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ error: 'Token requerido' }); return; }
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    res.json({ accessToken: signAccess(user.id, user.role) });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  // Respuesta idéntica tanto si existe como si no (evita enumeración)
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const exp   = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExp: exp } });
    await sendPasswordResetEmail(user.email, user.name, token);
  }
  res.json({ message: 'Si el email existe, recibirás un enlace en breve.' });
});

// POST /auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const body = z.object({ token: z.string(), password: z.string().min(8) }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: 'Datos inválidos' }); return; }

  const user = await prisma.user.findFirst({
    where: { resetToken: body.data.token, resetTokenExp: { gt: new Date() } },
  });
  if (!user) { res.status(400).json({ error: 'Token inválido o expirado' }); return; }

  const passwordHash = await bcrypt.hash(body.data.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExp: null, status: 'active' },
  });
  res.json({ message: 'Contraseña actualizada correctamente.' });
});

// GET /auth/me
router.get('/me', verifyJWT, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: {
      id: true, name: true, email: true, phone: true, plate: true,
      role: true, status: true, avatarColor: true,
      assignedPlaza: { select: { id: true, num: true, floor: true, bay: true, isShared: true, isMoto: true } },
    },
  });
  res.json(user);
});

// PUT /auth/me
router.put('/me', verifyJWT, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name:  z.string().min(2).optional(),
    phone: z.string().optional(),
    plate: z.string().optional(),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  const user = await prisma.user.update({ where: { id: req.userId }, data: body.data });
  res.json({ id: user.id, name: user.name, phone: user.phone, plate: user.plate });
});

// PUT /auth/me/password
router.put('/me/password', verifyJWT, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    current: z.string(),
    next:    z.string().min(8),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: 'Datos inválidos' }); return; }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (!user.passwordHash || !(await bcrypt.compare(body.data.current, user.passwordHash))) {
    res.status(400).json({ error: 'Contraseña actual incorrecta' }); return;
  }
  const passwordHash = await bcrypt.hash(body.data.next, 12);
  await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });
  res.json({ message: 'Contraseña actualizada' });
});

export default router;
