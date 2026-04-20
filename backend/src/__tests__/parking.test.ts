import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import app from '../app';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL } },
});

const JWT_SECRET = process.env.JWT_SECRET!;

// ─── Token helpers ───────────────────────────────────────────────────────────

function token(userId: string, role: string) {
  return `Bearer ${jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '1h' })}`;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

async function cleanDb() {
  await prisma.auditLog.deleteMany();
  await prisma.waitingQueue.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.liberation.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plaza.deleteMany();
  await prisma.adminRules.deleteMany();
}

async function seedBase() {
  await prisma.adminRules.create({
    data: {
      id: 1,
      advanceBookingHours: 48,
      weeklyQuotaPerUser: 3,
      monthlyUrgentQuota: 3,
      notifyOnLiberation: false,
    },
  });

  const plaza1 = await prisma.plaza.create({
    data: { id: 'plaza-1', floor: 'P-1', num: 1, bay: 'left', row: 1 },
  });
  const plaza2 = await prisma.plaza.create({
    data: { id: 'plaza-2', floor: 'P-1', num: 2, bay: 'left', row: 1 },
  });

  return { plaza1, plaza2 };
}

async function createUser(opts: {
  id: string;
  name: string;
  email: string;
  role: 'fixed' | 'floating' | 'admin';
  assignedPlazaId?: string;
  priority?: boolean;
}) {
  return prisma.user.create({
    data: {
      id: opts.id,
      name: opts.name,
      email: opts.email,
      role: opts.role,
      status: 'active',
      assignedPlazaId: opts.assignedPlazaId,
      priority: opts.priority ?? false,
    },
  });
}

async function createLiberation(userId: string, plazaId: string, date: Date) {
  return prisma.liberation.create({
    data: { plazaId, userId, date, halfDay: 'full' },
  });
}

// Returns a date N days from now (UTC midnight)
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── Suite setup ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. RESERVAS NORMALES
// ─────────────────────────────────────────────────────────────────────────────

describe('Reservas normales', () => {
  let plazaId: string;
  let floatingUser: { id: string };
  let fixedUser: { id: string };
  let libId: string;

  beforeEach(async () => {
    await cleanDb();
    const { plaza1 } = await seedBase();
    plazaId = plaza1.id;

    fixedUser = await createUser({ id: 'fixed-1', name: 'Fixed', email: 'fixed@test.com', role: 'fixed', assignedPlazaId: 'plaza-2' });
    floatingUser = await createUser({ id: 'float-1', name: 'Float', email: 'float@test.com', role: 'floating' });
    await createUser({ id: 'plaza2-owner', name: 'Owner2', email: 'owner2@test.com', role: 'fixed', assignedPlazaId: plazaId });

    // Liberar plaza-1 para dentro de 1 día
    const lib = await createLiberation('plaza2-owner', plazaId, daysFromNow(1));
    libId = lib.id;
  });

  it('reserva exitosa de plaza liberada', async () => {
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', token(floatingUser.id, 'floating'))
      .send({ liberationId: libId });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmed');
  });

  it('rechaza reserva en plaza ya confirmada → 409', async () => {
    // Primer usuario reserva
    await request(app)
      .post('/reservations')
      .set('Authorization', token(floatingUser.id, 'floating'))
      .send({ liberationId: libId });

    const float2 = await createUser({ id: 'float-2', name: 'Float2', email: 'float2@test.com', role: 'floating' });
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', token(float2.id, 'floating'))
      .send({ liberationId: libId });
    expect(res.status).toBe(409);
  });

  it('rechaza reserva con >48h de antelación para floating → 400', async () => {
    const futureLib = await createLiberation('plaza2-owner', plazaId, daysFromNow(5));
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', token(floatingUser.id, 'floating'))
      .send({ liberationId: futureLib.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/antelación/);
  });

  it('usuario fixed puede reservar con >48h de antelación → 201', async () => {
    const futureLib = await createLiberation('plaza2-owner', plazaId, daysFromNow(5));
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', token(fixedUser.id, 'fixed'))
      .send({ liberationId: futureLib.id });
    expect(res.status).toBe(201);
  });

  it('rechaza reserva cuando cupo semanal agotado (floating) → 400', async () => {
    // Todas las liberaciones en daysFromNow(1) para no chocar con el límite de 48h
    const p2 = await prisma.plaza.create({ data: { id: 'p-quota-2', floor: 'P2', num: 10, bay: 'left', row: 2 } });
    const p3 = await prisma.plaza.create({ data: { id: 'p-quota-3', floor: 'P2', num: 11, bay: 'left', row: 2 } });
    const p4 = await prisma.plaza.create({ data: { id: 'p-quota-4', floor: 'P2', num: 12, bay: 'left', row: 2 } });
    const owner2 = await createUser({ id: 'o2', name: 'O2', email: 'o2@t.com', role: 'fixed', assignedPlazaId: p2.id });
    const owner3 = await createUser({ id: 'o3', name: 'O3', email: 'o3@t.com', role: 'fixed', assignedPlazaId: p3.id });
    const owner4 = await createUser({ id: 'o4', name: 'O4', email: 'o4@t.com', role: 'fixed', assignedPlazaId: p4.id });

    // Reserva 1 (ya existe el libId de setUp → daysFromNow(1))
    await request(app).post('/reservations').set('Authorization', token(floatingUser.id, 'floating')).send({ liberationId: libId });

    // Reservas 2 y 3 — también en daysFromNow(1), plazas distintas
    const l2 = await createLiberation(owner2.id, p2.id, daysFromNow(1));
    await request(app).post('/reservations').set('Authorization', token(floatingUser.id, 'floating')).send({ liberationId: l2.id });

    const l3 = await createLiberation(owner3.id, p3.id, daysFromNow(1));
    await request(app).post('/reservations').set('Authorization', token(floatingUser.id, 'floating')).send({ liberationId: l3.id });

    // Reserva 4 — debe fallar por cupo semanal
    const l4 = await createLiberation(owner4.id, p4.id, daysFromNow(1));
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', token(floatingUser.id, 'floating'))
      .send({ liberationId: l4.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cupo semanal/);
  });

  it('usuario fixed puede reservar con cupo semanal agotado → 201', async () => {
    const p2 = await prisma.plaza.create({ data: { id: 'pf2', floor: 'P2', num: 20, bay: 'left', row: 2 } });
    const p3 = await prisma.plaza.create({ data: { id: 'pf3', floor: 'P2', num: 21, bay: 'left', row: 2 } });
    const p4 = await prisma.plaza.create({ data: { id: 'pf4', floor: 'P2', num: 22, bay: 'left', row: 2 } });
    const ow2 = await createUser({ id: 'of2', name: 'OFix2', email: 'ofix2@t.com', role: 'fixed', assignedPlazaId: p2.id });
    const ow3 = await createUser({ id: 'of3', name: 'OFix3', email: 'ofix3@t.com', role: 'fixed', assignedPlazaId: p3.id });
    const ow4 = await createUser({ id: 'of4', name: 'OFix4', email: 'ofix4@t.com', role: 'fixed', assignedPlazaId: p4.id });

    const lf1 = await createLiberation(ow2.id, p2.id, daysFromNow(1));
    const lf2 = await createLiberation(ow3.id, p3.id, daysFromNow(2));
    const lf3 = await createLiberation(ow4.id, p4.id, daysFromNow(3));

    // Fixed user llena cupo
    await request(app).post('/reservations').set('Authorization', token(fixedUser.id, 'fixed')).send({ liberationId: libId });
    await request(app).post('/reservations').set('Authorization', token(fixedUser.id, 'fixed')).send({ liberationId: lf1.id });
    await request(app).post('/reservations').set('Authorization', token(fixedUser.id, 'fixed')).send({ liberationId: lf2.id });

    // Cuarta reserva de fixed — debe pasar
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', token(fixedUser.id, 'fixed'))
      .send({ liberationId: lf3.id });
    expect(res.status).toBe(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. COLA Y AUTO-ASIGNACIÓN
// ─────────────────────────────────────────────────────────────────────────────

describe('Cola y auto-asignación', () => {
  let plazaId: string;
  let floatUser: { id: string };
  let fixedOwner: { id: string };
  let targetDate: Date;

  beforeEach(async () => {
    await cleanDb();
    const { plaza1, plaza2 } = await seedBase();
    plazaId = plaza1.id;
    targetDate = daysFromNow(1);

    fixedOwner = await createUser({ id: 'owner-1', name: 'Owner', email: 'owner@test.com', role: 'fixed', assignedPlazaId: plazaId });
    floatUser = await createUser({ id: 'float-q1', name: 'Float Q1', email: 'fq1@test.com', role: 'floating' });
  });

  it('unirse a la cola retorna posición correcta', async () => {
    const res = await request(app)
      .post('/queue')
      .set('Authorization', token(floatUser.id, 'floating'))
      .send({ date: targetDate.toISOString().slice(0, 10) });
    expect(res.status).toBe(201);
    expect(res.body.position).toBe(1);
  });

  it('no puede unirse a la cola si ya tiene reserva confirmada → 409', async () => {
    // Reserva directa usando otra plaza
    const lib = await createLiberation('owner-1', plazaId, targetDate);
    await request(app)
      .post('/reservations')
      .set('Authorization', token(floatUser.id, 'floating'))
      .send({ liberationId: lib.id });

    const res = await request(app)
      .post('/queue')
      .set('Authorization', token(floatUser.id, 'floating'))
      .send({ date: targetDate.toISOString().slice(0, 10) });
    expect(res.status).toBe(409);
  });

  it('liberación auto-asigna al primer usuario en cola', async () => {
    // Meter usuario en cola
    await prisma.waitingQueue.create({
      data: { userId: floatUser.id, date: targetDate, position: 1 },
    });

    // Liberar plaza → debe auto-asignar
    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1);

    // La cola debe estar vacía
    const queue = await prisma.waitingQueue.findFirst({ where: { userId: floatUser.id } });
    expect(queue).toBeNull();

    // La reserva debe existir
    const reservation = await prisma.reservation.findFirst({
      where: { userId: floatUser.id, date: targetDate },
    });
    expect(reservation).not.toBeNull();
    expect(reservation?.status).toBe('confirmed');
  });

  it('floating con cupo agotado en cola es saltado → no asignado', async () => {
    // Llenar cupo del usuario floating
    const p2 = await prisma.plaza.create({ data: { id: 'pcola2', floor: 'P2', num: 30, bay: 'left', row: 2 } });
    const p3 = await prisma.plaza.create({ data: { id: 'pcola3', floor: 'P2', num: 31, bay: 'left', row: 2 } });
    const p4 = await prisma.plaza.create({ data: { id: 'pcola4', floor: 'P2', num: 32, bay: 'left', row: 2 } });
    const o2 = await createUser({ id: 'co2', name: 'CO2', email: 'co2@t.com', role: 'fixed', assignedPlazaId: p2.id });
    const o3 = await createUser({ id: 'co3', name: 'CO3', email: 'co3@t.com', role: 'fixed', assignedPlazaId: p3.id });
    const o4 = await createUser({ id: 'co4', name: 'CO4', email: 'co4@t.com', role: 'fixed', assignedPlazaId: p4.id });

    const l1 = await createLiberation(o2.id, p2.id, daysFromNow(1));
    const l2 = await createLiberation(o3.id, p3.id, daysFromNow(2));
    const l3 = await createLiberation(o4.id, p4.id, daysFromNow(3));

    await request(app).post('/reservations').set('Authorization', token(floatUser.id, 'floating')).send({ liberationId: l1.id });
    await request(app).post('/reservations').set('Authorization', token(floatUser.id, 'floating')).send({ liberationId: l2.id });
    await request(app).post('/reservations').set('Authorization', token(floatUser.id, 'floating')).send({ liberationId: l3.id });

    // Meter en cola con cupo agotado
    await prisma.waitingQueue.create({
      data: { userId: floatUser.id, date: targetDate, position: 1 },
    });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(0); // nadie asignado

    // Cola sigue con el usuario (no se eliminó)
    const qEntry = await prisma.waitingQueue.findFirst({ where: { userId: floatUser.id } });
    expect(qEntry).not.toBeNull();
  });

  it('usuario fixed en cola con cupo agotado es asignado (exento) → asignado', async () => {
    const fixedInQueue = await createUser({
      id: 'fixed-queue', name: 'Fixed Queue', email: 'fqueue@test.com', role: 'fixed',
    });

    // Llenar cupo del fixed
    const p2 = await prisma.plaza.create({ data: { id: 'pfq2', floor: 'P2', num: 40, bay: 'left', row: 2 } });
    const p3 = await prisma.plaza.create({ data: { id: 'pfq3', floor: 'P2', num: 41, bay: 'left', row: 2 } });
    const p4 = await prisma.plaza.create({ data: { id: 'pfq4', floor: 'P2', num: 42, bay: 'left', row: 2 } });
    const ow2 = await createUser({ id: 'pfqo2', name: 'PO2', email: 'pfo2@t.com', role: 'fixed', assignedPlazaId: p2.id });
    const ow3 = await createUser({ id: 'pfqo3', name: 'PO3', email: 'pfo3@t.com', role: 'fixed', assignedPlazaId: p3.id });
    const ow4 = await createUser({ id: 'pfqo4', name: 'PO4', email: 'pfo4@t.com', role: 'fixed', assignedPlazaId: p4.id });

    // Usar días 2, 3, 4 para no coincidir con targetDate (daysFromNow(1))
    // Fixed users están exentos de la restricción de 48h, así que no hay problema
    const lf1 = await createLiberation(ow2.id, p2.id, daysFromNow(2));
    const lf2 = await createLiberation(ow3.id, p3.id, daysFromNow(3));
    const lf3 = await createLiberation(ow4.id, p4.id, daysFromNow(4));

    await request(app).post('/reservations').set('Authorization', token(fixedInQueue.id, 'fixed')).send({ liberationId: lf1.id });
    await request(app).post('/reservations').set('Authorization', token(fixedInQueue.id, 'fixed')).send({ liberationId: lf2.id });
    await request(app).post('/reservations').set('Authorization', token(fixedInQueue.id, 'fixed')).send({ liberationId: lf3.id });

    // Meter en cola para targetDate = daysFromNow(1) — sin reserva confirmada ese día
    await prisma.waitingQueue.create({
      data: { userId: fixedInQueue.id, date: targetDate, position: 1 },
    });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1); // asignado aunque cupo agotado
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. USUARIOS PRIORITARIOS
// ─────────────────────────────────────────────────────────────────────────────

describe('Usuarios prioritarios', () => {
  let plazaId: string;
  let fixedOwner: { id: string };
  let priorityUser: { id: string };
  let queueUser: { id: string };
  let targetDate: Date;

  beforeEach(async () => {
    await cleanDb();
    const { plaza1 } = await seedBase();
    plazaId = plaza1.id;
    targetDate = daysFromNow(1);

    fixedOwner = await createUser({ id: 'prio-owner', name: 'Owner', email: 'prioowner@test.com', role: 'fixed', assignedPlazaId: plazaId });
    priorityUser = await createUser({ id: 'prio-1', name: 'Priority', email: 'prio@test.com', role: 'floating', priority: true });
    queueUser = await createUser({ id: 'queue-1', name: 'Queue', email: 'queue@test.com', role: 'floating' });
  });

  it('prioritario sin reserva recibe plaza antes que la cola', async () => {
    // Queue user en posición 1, priority user no está en cola
    await prisma.waitingQueue.create({
      data: { userId: queueUser.id, date: targetDate, position: 1 },
    });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1);

    // El prioritario debe tener la reserva, no el de la cola
    const prioRes = await prisma.reservation.findFirst({
      where: { userId: priorityUser.id, date: targetDate },
    });
    expect(prioRes).not.toBeNull();

    const queueRes = await prisma.reservation.findFirst({
      where: { userId: queueUser.id, date: targetDate },
    });
    expect(queueRes).toBeNull();

    // La cola del queueUser sigue activa
    const qEntry = await prisma.waitingQueue.findFirst({ where: { userId: queueUser.id } });
    expect(qEntry).not.toBeNull();
  });

  it('prioritario que ya tiene reserva es saltado → cola recibe plaza', async () => {
    // Prioritario ya tiene reserva ese día (en otra plaza)
    const plaza2 = await prisma.plaza.create({ data: { id: 'prio-p2', floor: 'P1', num: 50, bay: 'left', row: 2 } });
    const owner2 = await createUser({ id: 'prio-o2', name: 'O2', email: 'po2@t.com', role: 'fixed', assignedPlazaId: plaza2.id });
    const lib2 = await createLiberation(owner2.id, plaza2.id, targetDate);
    await prisma.reservation.create({
      data: {
        plazaId: plaza2.id,
        userId: priorityUser.id,
        liberationId: lib2.id,
        date: targetDate,
        halfDay: 'full',
        status: 'confirmed',
      },
    });

    // Queue user en cola
    await prisma.waitingQueue.create({
      data: { userId: queueUser.id, date: targetDate, position: 1 },
    });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1);

    // Queue user debe tener la reserva
    const qRes = await prisma.reservation.findFirst({
      where: { userId: queueUser.id, date: targetDate },
    });
    expect(qRes).not.toBeNull();
  });

  it('dos prioritarios → primero elegible recibe plaza', async () => {
    const prio2 = await createUser({ id: 'prio-2', name: 'Priority2', email: 'prio2@test.com', role: 'floating', priority: true });

    // Primer prioritario ya tiene reserva ese día
    const plaza2 = await prisma.plaza.create({ data: { id: 'prio2-p2', floor: 'P1', num: 60, bay: 'left', row: 2 } });
    const owner2 = await createUser({ id: 'prio2-o2', name: 'PO2', email: 'prio2o2@t.com', role: 'fixed', assignedPlazaId: plaza2.id });
    const lib2 = await createLiberation(owner2.id, plaza2.id, targetDate);
    await prisma.reservation.create({
      data: {
        plazaId: plaza2.id,
        userId: priorityUser.id,
        liberationId: lib2.id,
        date: targetDate,
        halfDay: 'full',
        status: 'confirmed',
      },
    });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1);

    // prio2 debería tener la reserva
    const prio2Res = await prisma.reservation.findFirst({
      where: { userId: prio2.id, date: targetDate },
    });
    expect(prio2Res).not.toBeNull();
  });

  it('sin prioritarios elegibles → cola recibe plaza', async () => {
    // Prioritario tiene reserva ese día (skipped)
    const plaza2 = await prisma.plaza.create({ data: { id: 'nopr-p2', floor: 'P1', num: 70, bay: 'left', row: 2 } });
    const owner2 = await createUser({ id: 'nopr-o2', name: 'NO2', email: 'nopr2@t.com', role: 'fixed', assignedPlazaId: plaza2.id });
    const lib2 = await createLiberation(owner2.id, plaza2.id, targetDate);
    await prisma.reservation.create({
      data: {
        plazaId: plaza2.id,
        userId: priorityUser.id,
        liberationId: lib2.id,
        date: targetDate,
        halfDay: 'full',
        status: 'confirmed',
      },
    });

    await prisma.waitingQueue.create({
      data: { userId: queueUser.id, date: targetDate, position: 1 },
    });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1);

    const qRes = await prisma.reservation.findFirst({
      where: { userId: queueUser.id, date: targetDate },
    });
    expect(qRes).not.toBeNull();
  });

  it('prioritario excede cupo semanal → skipped, siguiente en cola recibe', async () => {
    // Llenar cupo del prioritario
    const pxPlazas = ['px1', 'px2', 'px3'].map((id, i) => ({ id, floor: 'P3', num: 80 + i, bay: 'left', row: 3 }));
    for (const p of pxPlazas) {
      await prisma.plaza.create({ data: p });
    }
    const pxOwners = await Promise.all(pxPlazas.map((p, i) =>
      createUser({ id: `pxo${i}`, name: `PXO${i}`, email: `pxo${i}@t.com`, role: 'fixed', assignedPlazaId: p.id })
    ));
    for (let i = 0; i < 3; i++) {
      const lib = await createLiberation(pxOwners[i].id, pxPlazas[i].id, daysFromNow(i + 1));
      await request(app)
        .post('/reservations')
        .set('Authorization', token(priorityUser.id, 'floating'))
        .send({ liberationId: lib.id });
    }

    // Cola
    await prisma.waitingQueue.create({
      data: { userId: queueUser.id, date: targetDate, position: 1 },
    });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(fixedOwner.id, 'fixed'))
      .send({ plazaId, dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1);

    // Queue user debe recibir (prioritario saltado por cupo)
    const qRes = await prisma.reservation.findFirst({
      where: { userId: queueUser.id, date: targetDate },
    });
    expect(qRes).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. RESERVAS URGENTES
// ─────────────────────────────────────────────────────────────────────────────

describe('Reservas urgentes', () => {
  let plazaId: string;
  let fixedOwner: { id: string };
  let floatReserver: { id: string };
  let urgentUser: { id: string };
  let libId: string;
  let targetDate: Date;

  beforeEach(async () => {
    await cleanDb();
    const { plaza1 } = await seedBase();
    plazaId = plaza1.id;
    targetDate = daysFromNow(1);

    fixedOwner = await createUser({ id: 'urg-owner', name: 'Owner', email: 'urgowner@test.com', role: 'fixed', assignedPlazaId: plazaId });
    floatReserver = await createUser({ id: 'urg-float', name: 'Float', email: 'urgfloat@test.com', role: 'floating' });
    urgentUser = await createUser({ id: 'urg-user', name: 'UrgentUser', email: 'urgent@test.com', role: 'fixed' });

    const lib = await createLiberation(fixedOwner.id, plazaId, targetDate);
    libId = lib.id;
  });

  it('urgente sobre plaza sin reserva → 201', async () => {
    const res = await request(app)
      .post('/reservations/urgent')
      .set('Authorization', token(urgentUser.id, 'fixed'))
      .send({ liberationId: libId, reason: 'Reunión importante con cliente' });
    expect(res.status).toBe(201);
    expect(res.body.urgent).toBe(true);
  });

  it('urgente desplaza a floating → 201, reserva del floating eliminada', async () => {
    // Floating reserva primero
    await request(app)
      .post('/reservations')
      .set('Authorization', token(floatReserver.id, 'floating'))
      .send({ liberationId: libId });

    const res = await request(app)
      .post('/reservations/urgent')
      .set('Authorization', token(urgentUser.id, 'fixed'))
      .send({ liberationId: libId, reason: 'Emergencia urgente de trabajo' });
    expect(res.status).toBe(201);
    expect(res.body.urgent).toBe(true);

    // La reserva del floating debe haber sido eliminada
    const floatRes = await prisma.reservation.findFirst({ where: { userId: floatReserver.id } });
    expect(floatRes).toBeNull();

    // La urgente debe existir
    const urgRes = await prisma.reservation.findFirst({ where: { userId: urgentUser.id } });
    expect(urgRes).not.toBeNull();
    expect(urgRes?.urgent).toBe(true);
  });

  it('urgente no puede desplazar a usuario fixed → 400', async () => {
    const fixedReserver = await createUser({ id: 'urg-fixed2', name: 'Fixed2', email: 'urgfixed2@test.com', role: 'fixed' });

    // Fixed reserva primero
    await request(app)
      .post('/reservations')
      .set('Authorization', token(fixedReserver.id, 'fixed'))
      .send({ liberationId: libId });

    const res = await request(app)
      .post('/reservations/urgent')
      .set('Authorization', token(urgentUser.id, 'fixed'))
      .send({ liberationId: libId, reason: 'Intentando desplazar a fixed' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/plaza fija/);
  });

  it('urgente sobre reserva desplazada existente en BD (bug fix) → 201 sin error', async () => {
    // Simula el estado que causaba el bug: hay un registro "displaced" en BD
    // con el mismo liberationId (antes el código los dejaba sin borrar)
    await prisma.reservation.create({
      data: {
        plazaId,
        userId: floatReserver.id,
        liberationId: libId,
        date: targetDate,
        halfDay: 'full',
        status: 'displaced', // estado residual que causaba el unique constraint error
      },
    });

    // El urgente debe gestionar el registro displaced y crear la nueva reserva
    const res = await request(app)
      .post('/reservations/urgent')
      .set('Authorization', token(urgentUser.id, 'fixed'))
      .send({ liberationId: libId, reason: 'Urgente sobre reserva desplazada' });
    expect(res.status).toBe(201);
    expect(res.body.urgent).toBe(true);

    // Solo debe existir la reserva urgente
    const allRes = await prisma.reservation.findMany({ where: { liberationId: libId } });
    expect(allRes).toHaveLength(1);
    expect(allRes[0].userId).toBe(urgentUser.id);
    expect(allRes[0].urgent).toBe(true);
  });

  it('urgente agota cupo mensual → 400', async () => {
    // Configurar cuota mensual en 1 para el test
    await prisma.adminRules.update({ where: { id: 1 }, data: { monthlyUrgentQuota: 1 } });

    // Crear plazas adicionales para las urgentes
    const pu1 = await prisma.plaza.create({ data: { id: 'pu1', floor: 'P3', num: 90, bay: 'left', row: 3 } });
    const ou1 = await createUser({ id: 'uou1', name: 'UO1', email: 'uou1@t.com', role: 'fixed', assignedPlazaId: pu1.id });
    const lu1 = await createLiberation(ou1.id, pu1.id, daysFromNow(2));

    // Primera urgente (usa el cupo)
    await request(app)
      .post('/reservations/urgent')
      .set('Authorization', token(urgentUser.id, 'fixed'))
      .send({ liberationId: libId, reason: 'Primera urgente valida' });

    // Segunda urgente — debe fallar
    const res = await request(app)
      .post('/reservations/urgent')
      .set('Authorization', token(urgentUser.id, 'fixed'))
      .send({ liberationId: lu1.id, reason: 'Segunda urgente bloqueada' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/urgentes/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CANCELACIONES
// ─────────────────────────────────────────────────────────────────────────────

describe('Cancelaciones', () => {
  let plazaId: string;
  let fixedOwner: { id: string };
  let floatUser: { id: string };
  let libId: string;
  let targetDate: Date;

  beforeEach(async () => {
    await cleanDb();
    const { plaza1 } = await seedBase();
    plazaId = plaza1.id;
    targetDate = daysFromNow(1);

    fixedOwner = await createUser({ id: 'canc-owner', name: 'Owner', email: 'cancowner@test.com', role: 'fixed', assignedPlazaId: plazaId });
    floatUser = await createUser({ id: 'canc-float', name: 'Float', email: 'cancfloat@test.com', role: 'floating' });

    const lib = await createLiberation(fixedOwner.id, plazaId, targetDate);
    libId = lib.id;
  });

  it('cancelar reserva propia → 200', async () => {
    const resCreate = await request(app)
      .post('/reservations')
      .set('Authorization', token(floatUser.id, 'floating'))
      .send({ liberationId: libId });
    const resId = resCreate.body.id;

    const res = await request(app)
      .delete(`/reservations/${resId}`)
      .set('Authorization', token(floatUser.id, 'floating'));
    expect(res.status).toBe(200);

    const reservation = await prisma.reservation.findUnique({ where: { id: resId } });
    expect(reservation).toBeNull();
  });

  it('no puede cancelar reserva ajena → 403', async () => {
    const resCreate = await request(app)
      .post('/reservations')
      .set('Authorization', token(floatUser.id, 'floating'))
      .send({ liberationId: libId });
    const resId = resCreate.body.id;

    const other = await createUser({ id: 'canc-other', name: 'Other', email: 'other@test.com', role: 'floating' });
    const res = await request(app)
      .delete(`/reservations/${resId}`)
      .set('Authorization', token(other.id, 'floating'));
    expect(res.status).toBe(403);
  });

  it('cancelar liberación sin reserva → 200', async () => {
    const res = await request(app)
      .delete(`/liberations/${libId}`)
      .set('Authorization', token(fixedOwner.id, 'fixed'));
    expect(res.status).toBe(200);

    const lib = await prisma.liberation.findUnique({ where: { id: libId } });
    expect(lib).toBeNull();
  });

  it('cancelar liberación con reserva confirmada → reserva borrada', async () => {
    await request(app)
      .post('/reservations')
      .set('Authorization', token(floatUser.id, 'floating'))
      .send({ liberationId: libId });

    const resBeforeDelete = await prisma.reservation.findFirst({ where: { liberationId: libId } });
    expect(resBeforeDelete).not.toBeNull();

    const res = await request(app)
      .delete(`/liberations/${libId}`)
      .set('Authorization', token(fixedOwner.id, 'fixed'));
    expect(res.status).toBe(200);

    const resAfterDelete = await prisma.reservation.findFirst({ where: { liberationId: libId } });
    expect(resAfterDelete).toBeNull();

    const lib = await prisma.liberation.findUnique({ where: { id: libId } });
    expect(lib).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ADMIN: toggle priority
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin: toggle priority', () => {
  let adminUser: { id: string };
  let floatUser: { id: string };

  beforeEach(async () => {
    await cleanDb();
    await seedBase();
    adminUser = await createUser({ id: 'adm-1', name: 'Admin', email: 'admin@test.com', role: 'admin' });
    floatUser = await createUser({ id: 'adm-float', name: 'Float', email: 'admfloat@test.com', role: 'floating' });
  });

  it('admin puede activar priority en usuario floating', async () => {
    const res = await request(app)
      .put(`/admin/users/${floatUser.id}`)
      .set('Authorization', token(adminUser.id, 'admin'))
      .send({ priority: true });
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: floatUser.id } });
    expect(user?.priority).toBe(true);
  });

  it('admin puede desactivar priority', async () => {
    await prisma.user.update({ where: { id: floatUser.id }, data: { priority: true } });

    const res = await request(app)
      .put(`/admin/users/${floatUser.id}`)
      .set('Authorization', token(adminUser.id, 'admin'))
      .send({ priority: false });
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: floatUser.id } });
    expect(user?.priority).toBe(false);
  });

  it('cambio de priority se refleja en siguiente liberación', async () => {
    const plazaOwner = await createUser({ id: 'ap-owner', name: 'APOwner', email: 'apowner@test.com', role: 'fixed', assignedPlazaId: 'plaza-1' });
    const targetDate = daysFromNow(1);

    // Activar priority
    await prisma.user.update({ where: { id: floatUser.id }, data: { priority: true } });

    const res = await request(app)
      .post('/liberations')
      .set('Authorization', token(plazaOwner.id, 'fixed'))
      .send({ plazaId: 'plaza-1', dates: [targetDate.toISOString().slice(0, 10)], halfDay: 'full' });
    expect(res.status).toBe(201);
    expect(res.body.assigned).toBe(1);

    const prioRes = await prisma.reservation.findFirst({ where: { userId: floatUser.id } });
    expect(prioRes).not.toBeNull();
  });
});
