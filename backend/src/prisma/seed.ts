import { PrismaClient } from '@prisma/client';

const Role = { fixed: 'fixed', floating: 'floating', admin: 'admin', guest: 'guest' } as const;
const UserStatus = { invited: 'invited', pending: 'pending', active: 'active', disabled: 'disabled' } as const;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Plaza layout (portado de design/src/data.jsx) ───────────────────────────

type SlotExtra = {
  col?: 'outer' | 'inner';
  isRamp?: boolean;
  isService?: boolean;
  isMoto?: boolean;
  isShared?: boolean;
};

function makeFloor(floor: string): Array<{
  id: string; floor: string; num: number; bay: string; row: number;
} & SlotExtra> {
  const slot = (localId: string, num: number, bay: string, row: number, extra: SlotExtra = {}) => ({
    id: `${floor}-${localId}`,
    floor,
    num,
    bay,
    row,
    ...extra,
  });

  const slots: ReturnType<typeof slot>[] = [];

  // TOP ROW (1..17, izq→der)
  for (let i = 1; i <= 17; i++) {
    const isRamp = i === 8 || i === 10;
    slots.push(slot(`T${i}`, i, 'top', 0, { isRamp }));
  }

  // LEFT BAY
  const leftOuter = [115,114,113,112,111,110,109,108,107,106,105,104,103,102,101,100,99,98];
  const leftInner = [80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97];
  leftOuter.forEach((n, i) => slots.push(slot(`L-O-${n}`, n, 'left', i + 1, { col: 'outer' })));
  leftInner.forEach((n, i) => slots.push(slot(`L-I-${n}`, n, 'left', i + 1, { col: 'inner' })));

  // MIDDLE BAY
  const midLeftTop  = [53,52,51,50,49,48,47,46];
  const midRightTop = [54,55,56,57,58,59,60,61];
  midLeftTop.forEach((n,i)  => slots.push(slot(`M-L-${n}`, n, 'mid', i + 1,  { col: 'outer' })));
  midRightTop.forEach((n,i) => slots.push(slot(`M-R-${n}`, n, 'mid', i + 1,  { col: 'inner' })));
  const midLeftBot  = [71,70,69,68,67];
  const midRightBot = [62,63,64,65,66];
  midLeftBot.forEach((n,i)  => slots.push(slot(`M-L-${n}`, n, 'mid', i + 14, { col: 'outer' })));
  midRightBot.forEach((n,i) => slots.push(slot(`M-R-${n}`, n, 'mid', i + 14, { col: 'inner' })));

  // RIGHT BAY
  const rightOuter = [53,52,51,50,49,48,47,46,45,44,43,42,41,40,39,38,37,36];
  const rightInner = [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35];
  rightOuter.forEach((n,i) => slots.push(slot(`R-O-${n}`, n, 'right', i + 1, { col: 'outer' })));
  rightInner.forEach((n,i) => slots.push(slot(`R-I-${n}`, n, 'right', i + 1, { col: 'inner' })));

  return slots;
}

// ─── Fixed-plaza users (datos reales del cliente) ────────────────────────────

const FIXED_USERS: Array<{
  name: string;
  email: string;
  plazaLocalId: string;
  floor: string;
  avatarColor: string;
  isMoto?: boolean;
  isShared?: boolean;
  coOwnerEmail?: string;
}> = [
  { name: 'Carolina Sáez',          email: 'carolina.saez@aptica.es',      plazaLocalId: 'T15',   floor: 'P-1', avatarColor: '#6A1873' },
  { name: 'Jose Ramón Saez',        email: 'jramon.saez@aptica.es',        plazaLocalId: 'T16',   floor: 'P-1', avatarColor: '#7296BC' },
  { name: 'Juan Mauricio Gonzalez', email: 'jmauricio.gonzalez@aptica.es', plazaLocalId: 'T17',   floor: 'P-1', avatarColor: '#58457A' },
  // P-1·19 Furgo → no tiene usuario, la plaza se marca sin owner
  { name: 'Jesús Silveira',         email: 'jesus.silveira@aptica.es',     plazaLocalId: 'R-I-20', floor: 'P-2', avatarColor: '#7296BC' },
  {
    name: 'Javi Pérez',             email: 'javier.perez@aptica.es',       plazaLocalId: 'R-I-21', floor: 'P-2',
    avatarColor: '#6A1873', isMoto: true, isShared: true, coOwnerEmail: 'santiago.sopelana@aptica.es',
  },
  {
    name: 'Santiago Sopelana',      email: 'santiago.sopelana@aptica.es',  plazaLocalId: 'R-I-21', floor: 'P-2',
    avatarColor: '#58457A', isMoto: true, isShared: true, coOwnerEmail: 'javier.perez@aptica.es',
  },
  { name: 'Jose Vicente',           email: 'josev.rodriguez@aptica.es',    plazaLocalId: 'R-I-22', floor: 'P-2', avatarColor: '#7296BC' },
  { name: 'Javier Peñín',          email: 'javier.penin@aptica.es',       plazaLocalId: 'R-I-25', floor: 'P-2', avatarColor: '#6A1873' },
  { name: 'Agustín Gómez',         email: 'agustin.gomez@aptica.es',      plazaLocalId: 'R-O-41', floor: 'P-2', avatarColor: '#58457A' },
  { name: 'Javier de Paz',         email: 'javier.depaz@aptica.es',       plazaLocalId: 'R-O-42', floor: 'P-2', avatarColor: '#7296BC' },
  { name: 'Josué López',           email: 'josue.lopez@aptica.es',        plazaLocalId: 'R-O-43', floor: 'P-2', avatarColor: '#6A1873' },
];

// Plazas con propiedades especiales (sin owner de persona)
const SPECIAL_PLAZAS: Record<string, SlotExtra> = {
  'P-1-T19':   {},                        // Furgo APTICA — sin owner
  'P-2-M-R-60': { isService: true },      // Carga y descarga
  'P-2-R-I-21': { isMoto: true, isShared: true },
};

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Upsert AdminRules
  await prisma.adminRules.upsert({
    where: { id: 1 },
    create: {},
    update: {},
  });

  // 2. Upsert all plazas (P-1 + P-2)
  const allSlots = [...makeFloor('P-1'), ...makeFloor('P-2')];
  for (const slot of allSlots) {
    const special = SPECIAL_PLAZAS[slot.id] ?? {};
    await prisma.plaza.upsert({
      where: { id: slot.id },
      create: {
        id: slot.id,
        floor: slot.floor,
        num: slot.num,
        bay: slot.bay,
        col: slot.col ?? null,
        row: slot.row,
        isRamp:    slot.isRamp    ?? special.isRamp    ?? false,
        isService: slot.isService ?? special.isService ?? false,
        isMoto:    slot.isMoto    ?? special.isMoto    ?? false,
        isShared:  slot.isShared  ?? special.isShared  ?? false,
      },
      update: {
        isRamp:    slot.isRamp    ?? special.isRamp    ?? false,
        isService: slot.isService ?? special.isService ?? false,
        isMoto:    slot.isMoto    ?? special.isMoto    ?? special.isMoto ?? false,
        isShared:  slot.isShared  ?? special.isShared  ?? false,
      },
    });
  }
  console.log(`  ✓ ${allSlots.length} plazas upserted`);

  // 3. Upsert admin user
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@aptica.es' },
    create: {
      name: 'Admin Aptica',
      email: 'admin@aptica.es',
      passwordHash: adminHash,
      role: Role.admin,
      status: UserStatus.active,
      avatarColor: '#5A5A5C',
    },
    update: {},
  });
  console.log('  ✓ Admin user upserted');

  // 4. Upsert fixed-plaza users (status: invited — sin contraseña hasta que admin envíe reset)
  for (const u of FIXED_USERS) {
    const plazaId = `${u.floor}-${u.plazaLocalId}`;
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        name: u.name,
        email: u.email,
        role: Role.fixed,
        status: UserStatus.invited,
        avatarColor: u.avatarColor,
        assignedPlazaId: plazaId,
      },
      update: {
        name: u.name,
        role: Role.fixed,
        assignedPlazaId: plazaId,
      },
    });
  }
  console.log(`  ✓ ${FIXED_USERS.length} fixed-plaza users upserted`);

  // 5. Mark plaza P-2-R-I-21 as shared+moto (users are already linked via assignedPlazaId)
  await prisma.plaza.update({
    where: { id: 'P-2-R-I-21' },
    data: { isShared: true, isMoto: true },
  });
  console.log('  ✓ Co-owners wired for plaza P-2-R-I-21');

  console.log('✅ Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
