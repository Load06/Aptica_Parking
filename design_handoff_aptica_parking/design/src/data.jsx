// Mock data + helpers

// Parking layout derived from the two PDFs the user attached.
// Each floor has 3 bays (left, middle, right) + top perimeter row.
// Plaza objects: { id, floor, bay, row, num, assigned, shared, isLoad, isDisabled, disabledCar }

function makeFloor(floor, assignments = {}) {
  // helper
  const slot = (id, num, bay, row, extra = {}) => ({
    id: `${floor}-${id}`, floor, num, bay, row, assigned: assignments[num] || null, ...extra,
  });

  const slots = [];
  // TOP ROW (perimeter along top, numbered right-to-left: 1..17)
  for (let i = 1; i <= 17; i++) {
    // indexes 8..10 roughly "ramp / crosswalk" areas — we'll mark 8 and 10 as ramps (gaps)
    const isRamp = (i === 8 || i === 10);
    slots.push({
      id: `${floor}-T${i}`, floor, bay: 'top', row: 0, num: i,
      assigned: assignments[`T${i}`] || null, isRamp,
    });
  }
  // LEFT BAY — outer col 98..115 (18 spots, rows 1..18), inner col 80..97
  // In plan: outer left shows 115 top -> 98 bottom; inner left 80 top -> 97 bottom
  const leftOuter = [115,114,113,112,111,110,109,108,107,106,105,104,103,102,101,100,99,98];
  const leftInner = [80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97];
  leftOuter.forEach((n,i) => slots.push(slot(`L-O-${n}`, n, 'left', i+1, { col: 'outer' })));
  leftInner.forEach((n,i) => slots.push(slot(`L-I-${n}`, n, 'left', i+1, { col: 'inner' })));
  // MIDDLE BAY — has "island" gap (parking office / stairs). Top: 53..61, bottom: 62..71.
  // Outer middle left: 53..61 rows 1..9 ; then island (rows 10..14) ; then 62..71 rows 15..22
  // Inner middle right: 54..61 rows 1..8 ; then island ; then 62..71 rows 15..22
  const midLeftTop = [53,52,51,50,49,48,47,46];
  const midRightTop = [54,55,56,57,58,59,60,61];
  midLeftTop.forEach((n,i) => slots.push(slot(`M-L-${n}`, n, 'mid', i+1, { col: 'outer' })));
  midRightTop.forEach((n,i) => slots.push(slot(`M-R-${n}`, n, 'mid', i+1, { col: 'inner' })));
  const midLeftBot = [71,70,69,68,67];
  const midRightBot = [62,63,64,65,66];
  midLeftBot.forEach((n,i) => slots.push(slot(`M-L-${n}`, n, 'mid', i+14, { col: 'outer' })));
  midRightBot.forEach((n,i) => slots.push(slot(`M-R-${n}`, n, 'mid', i+14, { col: 'inner' })));
  // RIGHT BAY — outer right 36..53 (bottom-to-top), inner right 18..35 (mostly)
  const rightOuter = [53,52,51,50,49,48,47,46,45,44,43,42,41,40,39,38,37,36];
  const rightInner = [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35];
  rightOuter.forEach((n,i) => slots.push(slot(`R-O-${n}`, n, 'right', i+1, { col: 'outer' })));
  rightInner.forEach((n,i) => slots.push(slot(`R-I-${n}`, n, 'right', i+1, { col: 'inner' })));

  return slots;
}

// Assignments for P-2 (from image 1)
const P2_ASSIGNMENTS = {
  // right bay inner column has these
};

// We need to tie assigned users to their specific slot id.
// P-1 top row has Juanma(17), Joserra(16), Carol(15).
const P1_ASSIGNED = {
  'T17': { name: 'Juanma', short: 'JM' },
  'T16': { name: 'Joserra', short: 'JS' },
  'T15': { name: 'Carol', short: 'CA' },
};

// P-2 right inner column assignments
const P2_ASSIGNED_SLOT_IDS = {
  'R-I-19': { name: 'Furgo APTICA', short: 'FG', tag: 'APTICA-Furgo' },
  'R-I-20': { name: 'Jesús', short: 'JE', tag: 'APTICA - Jesús' },
  'R-I-21': { name: 'Javi P. / Santi', short: 'JP', tag: 'APTICA 21', shared: true, sharedWith: ['Javi Pérez', 'Santi'], isMoto: true },
  'R-I-22': { name: 'J.V. Rodríguez', short: 'JR', tag: 'APTICA 22' },
  'R-I-25': { name: 'Elena', short: 'EL', tag: 'APTICA - Elena' },
  'R-I-43': { name: 'Josué', short: 'JO', tag: 'APTICA - Josué' },
  'R-I-42': { name: 'J. Paz', short: 'JZ', tag: 'APTICA - J.Paz' },
  'R-I-41': { name: 'Agus', short: 'AG', tag: 'APTICA - Agus' },
  'M-R-47': { name: 'Carga y Descarga', short: 'CD', tag: 'CARGA Y DESCARGA', isService: true },
};

const P1_ASSIGNED_SLOT_IDS = {
  'T17': { name: 'Juanma', short: 'JM', tag: 'Juanma' },
  'T16': { name: 'Joserra', short: 'JS', tag: 'Joserra' },
  'T15': { name: 'Carol', short: 'CA', tag: 'Carol' },
};

// Build floors
const FLOOR_P1 = makeFloor('P-1').map(s => {
  const meta = P1_ASSIGNED_SLOT_IDS[s.id.replace('P-1-','')] || P1_ASSIGNED_SLOT_IDS[s.num] || null;
  if (meta) s.assigned = meta;
  return s;
});
const FLOOR_P2 = makeFloor('P-2').map(s => {
  const key = s.id.replace('P-2-','');
  const meta = P2_ASSIGNED_SLOT_IDS[key] || null;
  if (meta) {
    s.assigned = meta;
    if (meta.isService) s.isService = true;
    if (meta.shared) { s.shared = true; s.sharedWith = meta.sharedWith; s.isMoto = meta.isMoto; }
  }
  return s;
});

// Who "I" am — a user with plaza fija on P-2 slot R-I-25 (Elena)
const CURRENT_USER = {
  id: 'u-elena',
  name: 'Elena García',
  email: 'elena.garcia@aptica.com',
  phone: '+34 612 345 678',
  role: 'fixed', // fixed | floating | admin | guest
  plazaId: 'P-2-R-I-25',
  plazaNum: 25,
  floor: 'P-2',
  plate: '1234 ABC',
  avatar: '#6A1873',
  initials: 'EG',
};

// Users directory (admin)
const USERS_DB = [
  { id:'u-elena',   name:'Elena García',       email:'elena.garcia@aptica.com',  role:'fixed',    plaza:'P-2 · 25',  plate:'1234 ABC', status:'active', avatar:'#6A1873' },
  { id:'u-juanma',  name:'Juanma López',       email:'juanma.lopez@aptica.com',  role:'fixed',    plaza:'P-1 · 17',  plate:'4456 DHG', status:'active', avatar:'#7296BC' },
  { id:'u-joserra', name:'Joserra Díez',       email:'joserra.d@aptica.com',     role:'fixed',    plaza:'P-1 · 16',  plate:'7812 KLS', status:'active', avatar:'#58457A' },
  { id:'u-carol',   name:'Carol Ruiz',         email:'carol.ruiz@aptica.com',    role:'fixed',    plaza:'P-1 · 15',  plate:'9981 MPL', status:'active', avatar:'#6A1873' },
  { id:'u-jesus',   name:'Jesús Hernández',    email:'jesus.h@aptica.com',       role:'fixed',    plaza:'P-2 · 20',  plate:'2231 QRT', status:'active', avatar:'#7296BC' },
  { id:'u-javi',    name:'Javi Pérez',         email:'javi.perez@aptica.com',    role:'fixed',    plaza:'P-2 · 21 (compartida)', plate:'MOT 2341', status:'active', avatar:'#58457A', sharedWith:'u-santi' },
  { id:'u-santi',   name:'Santi Morales',      email:'santi.morales@aptica.com', role:'fixed',    plaza:'P-2 · 21 (compartida)', plate:'MOT 5512', status:'active', avatar:'#6A1873', sharedWith:'u-javi' },
  { id:'u-jvr',     name:'J.V. Rodríguez',     email:'jv.rodriguez@aptica.com',  role:'fixed',    plaza:'P-2 · 22',  plate:'5564 DFV', status:'active', avatar:'#7296BC' },
  { id:'u-josue',   name:'Josué Martín',       email:'josue.m@aptica.com',       role:'fixed',    plaza:'P-2 · 43',  plate:'3341 KLP', status:'active', avatar:'#58457A' },
  { id:'u-jpaz',    name:'J. Paz',             email:'j.paz@aptica.com',         role:'fixed',    plaza:'P-2 · 42',  plate:'8812 SDR', status:'active', avatar:'#6A1873' },
  { id:'u-agus',    name:'Agustín Torres',     email:'agus.torres@aptica.com',   role:'fixed',    plaza:'P-2 · 41',  plate:'1147 ABT', status:'active', avatar:'#7296BC' },
  { id:'u-maria',   name:'María Soler',        email:'maria.soler@aptica.com',   role:'floating', plaza:'—',         plate:'6677 XCV', status:'active', avatar:'#58457A' },
  { id:'u-diego',   name:'Diego Navarro',      email:'diego.navarro@aptica.com', role:'floating', plaza:'—',         plate:'3392 BNM', status:'active', avatar:'#6A1873' },
  { id:'u-laura',   name:'Laura Ferrer',       email:'laura.ferrer@aptica.com',  role:'floating', plaza:'—',         plate:'5521 ZXC', status:'active', avatar:'#7296BC' },
  { id:'u-paula',   name:'Paula Vidal',        email:'paula.vidal@aptica.com',   role:'floating', plaza:'—',         plate:'9910 QWE', status:'pending', avatar:'#58457A' },
  { id:'u-admin',   name:'Admin Aptica',       email:'admin@aptica.com',         role:'admin',    plaza:'—',         plate:'—', status:'active', avatar:'#5A5A5C' },
  { id:'u-invitado',name:'Cliente (visita)',   email:'visitas@aptica.com',       role:'guest',    plaza:'—',         plate:'—', status:'active', avatar:'#8E8E93' },
];

// Calendar helpers
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['L','M','X','J','V','S','D'];
const DAYS_ES_LONG = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function sameYMD(a,b) { return ymd(a)===ymd(b); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function isWeekend(d) { const g=d.getDay(); return g===0||g===6; }

// Today = Thursday April 23 2026 for demo stability
const TODAY = new Date(2026, 3, 23);

// Recent activity feed (who liberated plazas)
const ACTIVITY = [
  { id:1, who:'Juanma López', plaza:'P-1 · 17', date:'Hoy',        time:'09:12', tag:'liberó' },
  { id:2, who:'Jesús H.',     plaza:'P-2 · 20', date:'Hoy',        time:'08:34', tag:'liberó' },
  { id:3, who:'J.V. Rodríguez',plaza:'P-2 · 22',date:'Ayer',       time:'17:48', tag:'liberó' },
  { id:4, who:'Carol Ruiz',   plaza:'P-1 · 15', date:'24 Abr',     time:'10:02', tag:'liberó' },
  { id:5, who:'Josué Martín', plaza:'P-2 · 43', date:'24 Abr',     time:'09:55', tag:'liberó' },
];

// Reservations by slot-date (who has the slot for a given day)
const RESERVATIONS = {
  'P-1-17_2026-04-23': { who: 'María Soler', userId:'u-maria' },
  'P-2-20_2026-04-23': { who: 'Diego Navarro', userId:'u-diego' },
};

Object.assign(window, {
  FLOOR_P1, FLOOR_P2, CURRENT_USER, USERS_DB, ACTIVITY, RESERVATIONS,
  MONTHS_ES, DAYS_ES, DAYS_ES_LONG, ymd, sameYMD, addDays, startOfMonth, isWeekend, TODAY,
});
