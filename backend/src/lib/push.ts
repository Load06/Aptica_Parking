import webpush from 'web-push';
import { prisma } from './prisma';

webpush.setVapidDetails(
  'mailto:admin@aptica.es',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToUser(userId: string, payload: object) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } });
        }
      }),
    ),
  );
}

export async function sendPushToRole(role: string, payload: object) {
  const users = await prisma.user.findMany({
    where: { role: role as never, status: 'active' as never },
    select: { id: true },
  });
  await Promise.allSettled(users.map((u: { id: string }) => sendPushToUser(u.id, payload)));
}
