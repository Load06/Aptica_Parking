import { Router, Response } from 'express';
import { z } from 'zod';
import { verifyJWT, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /push/subscribe
router.post('/subscribe', verifyJWT, async (req: AuthRequest, res: Response) => {
  const body = z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
  }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.flatten() }); return; }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.data.endpoint },
    create: {
      userId:   req.userId!,
      endpoint: body.data.endpoint,
      p256dh:   body.data.keys.p256dh,
      auth:     body.data.keys.auth,
    },
    update: {
      userId: req.userId!,
      p256dh: body.data.keys.p256dh,
      auth:   body.data.keys.auth,
    },
  });
  res.status(201).json({ message: 'Suscripción guardada' });
});

// DELETE /push/subscribe
router.delete('/subscribe', verifyJWT, async (req: AuthRequest, res: Response) => {
  const { endpoint } = z.object({ endpoint: z.string() }).parse(req.body);
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId } });
  res.json({ message: 'Suscripción eliminada' });
});

// GET /push/vapid-public-key
router.get('/vapid-public-key', (_req, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export default router;
