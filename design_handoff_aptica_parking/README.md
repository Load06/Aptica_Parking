# Handoff: Aptica Parking — Gestión de plazas de parking

## Overview
Web app mobile-first (funciona también en desktop responsive) para gestionar las plazas de parking de la oficina de Aptica. Permite:
- A usuarios con plaza fija: **liberar** su plaza días concretos, rangos o recurrente.
- A usuarios sin plaza fija: **reservar** plazas liberadas, con cupo semanal y opción de reserva urgente.
- Ver un **mapa interactivo** de las dos plantas del parking (P-1 y P-2).
- Gestionar **usuarios y reglas** (admin).
- Configurar **perfil y notificaciones**.

## About the Design Files
Los archivos incluidos en `design/` son **referencias de diseño creadas en HTML/React/Babel** — son prototipos que muestran el aspecto final y el comportamiento deseado. **No son código de producción**. La tarea es **recrear estos diseños en el entorno de desarrollo objetivo** (React + Vite + Tailwind, Next.js, React Native, etc.) usando los patrones y librerías establecidos de ese proyecto. Si el proyecto todavía no tiene stack decidido, una pila recomendada sería:
- **Web**: React + Vite + TypeScript + Tailwind CSS + React Router + shadcn/ui
- **Backend**: Node.js/Express o Python/FastAPI con PostgreSQL + Prisma/SQLAlchemy
- **Auth**: JWT + bcrypt con emails de recuperación (SendGrid / Resend)
- **Hosting**: Vercel / Railway

## Fidelity
**High-fidelity.** Los mockups son pixel-perfect con colores corporativos, tipografía, espaciado e interacciones reales implementadas. El desarrollador debe reproducir la UI con fidelidad alta usando las librerías existentes del proyecto.

---

## Design Tokens

### Colores
```
/* Primarios */
--purple:      #6A1873   /* acción principal, marca */
--purple-dark: #58457A   /* gradiente + variante oscura */
--gray:        #5A5A5C   /* neutral dark */

/* Secundarios */
--blue:        #7296BC
--blue-soft:   #EAF1F8

/* Soportes de UI */
--purple-soft: #F4EEF5   /* fondo de chips morados */
--purple-badge:#EADDEE
--gray-mid:    #8E8E93   /* text secundario */
--gray-line:   #E8E6EA   /* borders */
--gray-bg:     #F6F5F7   /* fondo de segmented controls */
--bg:          #FBFAFC   /* fondo general de app */
--ink:         #1A1220   /* texto primario */
--ink2:        #3A3340   /* texto secundario */

/* Estado */
--ok:          #2E9E6A   /* éxito, tu plaza */
--ok-soft:     #E6F4ED
--warn:        #D97706   /* urgente, cupo excedido */
--warn-soft:   #FDF2E0
--red:         #C4314B   /* destructivo, logout */
--red-soft:    #FBE8EC
```

### Tipografía
- **Font family**: `Plus Jakarta Sans` (Google Fonts, pesos 400, 500, 600, 700, 800)
- **Fallback**: `-apple-system, BlinkMacSystemFont, system-ui, sans-serif`

Escala:
| Uso                  | Size | Weight | Letter-spacing |
|---------------------|------|--------|----------------|
| H1 (pantalla)       | 26px | 800    | -0.8           |
| H2 (sección)        | 22px | 800    | -0.6           |
| Título card grande  | 20px | 700    | -0.3           |
| Body                | 15px | 600/500| -0.1           |
| Secondary text      | 13px | 500    | 0              |
| Overline            | 11px | 700    | 1.2 uppercase  |
| Micro/Label         | 10px | 700    | 0.4 uppercase  |
| Número plaza (hero) | 56px | 800    | -2.5           |

### Espaciado (múltiplos de 4)
`4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32, 48`

### Radios
```
--r-sm: 8px    /* botones sm, tags */
--r-md: 12px   /* inputs, cards pequeñas */
--r-lg: 14px   /* botones lg */
--r-xl: 18px   /* cards */
--r-2xl: 24px  /* hero cards */
--r-sheet: 28px /* bottom sheets */
--r-pill: 999px
```

### Sombras
```
--shadow-card:    0 1px 2px rgba(26,18,32,0.03), 0 2px 10px rgba(26,18,32,0.025)
--shadow-btn:     0 1px 2px rgba(106,24,115,0.12), 0 6px 16px rgba(106,24,115,0.22)
--shadow-fab:     0 6px 18px rgba(106,24,115,0.4), 0 2px 4px rgba(106,24,115,0.2)
--shadow-tabbar:  0 8px 24px rgba(26,18,32,0.08), 0 2px 6px rgba(26,18,32,0.04)
--shadow-sheet:   0 -6px 24px rgba(0,0,0,0.1)
```

---

## Screens / Views

### 1. **Home / Hoy**
Pantalla principal al abrir la app.
- **Header**: fecha en gris pequeño + saludo "Hola, {Nombre}" (26/800). Botón circular de notificaciones a la derecha con punto morado si hay novedades.
- **Hero card adaptativo según rol**:
  - `fixed`: card morado con gradiente 135° `#6A1873 → #58457A`, overline "TU PLAZA FIJA", número gigante (56px/800), planta + nave, dos botones glass ("Liberar plaza" + icono mapa).
  - `floating` con reserva: card blanco, badge verde "Reserva confirmada · Hoy", bloque morado con número, horario, CTA "Ver en el mapa".
  - `floating` sin reserva: card punteado, CTA "Reservar plaza".
  - `admin`: 3 stats (Liberadas hoy / Reservadas / Usuarios).
  - `guest`: card azul invitándole a solicitar plaza puntual.
- **Week strip** (14 días): botones 52×66px con día + número; hoy destacado con punto, seleccionado en morado sólido.
- **Actividad reciente**: card con filas de avatar + "Juanma López liberó P-1 · 17" + timestamp. Si el usuario es `floating`, cada fila tiene un botón "Reservar".
- **Accesos rápidos** (solo `fixed`): 2 tiles con icono morado en fondo suave.

### 2. **Liberar plaza** (Bottom Sheet, altura auto)
Se abre al pulsar el FAB central o el botón del hero.
- **Segmented control** con 3 modos: "Días sueltos" / "Rango" / "Recurrente".
- **Modos multi/range**: calendario mensual completo con navegación de mes, selección múltiple o rango con highlight de los días intermedios. Días pasados deshabilitados, fin de semana en gris medio. Día actual con outline morado.
- **Selector de horario**: 3 chips grandes 56px — "Día completo" / "Sólo mañana (8–14h)" / "Sólo tarde (14–19h)".
- **Modo recurrente**: selector de día de la semana (7 botones), luego "Hasta" (1 mes / 3 meses / 6 meses / Indefinido).
- **Resumen**: card en gris con contador de días seleccionados.
- **Footer**: Cancelar (secundario) + Liberar (primario).

### 3. **Reservar**
- **Header**: título + "Ventana: **48h por adelantado**".
- **Cupo semanal**: card con "Tu cupo semanal", barras visuales de 3 días. Cuando el cupo está agotado, fondo warn con icono de aviso.
- **Week strip** para elegir día.
- **Lista de plazas disponibles**: cada fila es un card con:
  - Tile 56×56 con planta + número (morado suave si libre, gris si ocupada).
  - Nombre del titular + horario liberado.
  - Badge "Ocupada" si otro usuario la ha reservado.
  - Botón "Reservar" (soft) o "Urgente" (warn) si está ocupada.
- **Reserva urgente** (bottom sheet): explicación, aviso de que solo puede desplazar a usuarios sin plaza fija, contador "2 de 3 este mes", textarea de motivo, botones Cancelar / "Quitar y reservar" (naranja).

### 4. **Mapa**
- **Header**: título + instrucción.
- **Tabs Planta P-1 / P-2** (segmented control).
- **Stats row**: 3 tiles con Libres / Liberadas / Ocupadas.
- **Mapa SVG**: renderizado con estas características:
  - Perímetro + 3 naves (izquierda, central, derecha) + isla central (oficina/escaleras).
  - Crosswalks rayados en blanco/negro sobre los huecos de rampa.
  - Entrada/Salida con etiqueta morada.
  - Plazas asignadas en morado sólido con etiqueta de nombre (ej. "APTICA-Furgo", "APTICA - Jesús").
  - Plaza propia con borde verde.
  - Plaza liberada: fondo morado suave.
  - Plaza servicio (47 carga/descarga): morado oscuro.
  - Plaza compartida (21 Javi/Santi motos): icono pequeño de moto.
- **Legenda** con colores y significados.
- **Slot detail bottom sheet** al tocar plaza: tile grande con número, titular, nave, badges de compartida, CTA contextual.

### 5. **Perfil**
- **Identity card**: avatar 64px, nombre 18/800, email, badges de rol + plaza.
- **Sección Cuenta**: Datos personales, Matrícula, Contraseña (con icono en tile morado suave).
- **Sección Notificaciones**: Toggles para "Nueva plaza liberada" y "Recordatorio de reserva (el día anterior a las 18:00)".
- **Sección Administración** (solo admin): Gestionar usuarios, Reglas de reserva.
- **Cerrar sesión**: fila destacada en rojo.
- **Footer**: "Aptica Parking · v1.2.0".

### 6. **Admin**
Se accede desde Perfil → Administración.
- **Header** con flecha de volver + título.
- **Tabs**: Usuarios / Reglas / Historial.
- **Usuarios**: input de búsqueda + botón "Nuevo". Lista de cards con avatar, nombre (Badge "Pendiente" si aplica), email, badges de rol y plaza.
- **Detalle usuario** (sheet): avatar grande, email, badges, filas editables (Rol, Plaza, Matrícula), botones "Enviar reset" y "Eliminar".
- **Reglas**:
  - **Antelación máxima**: 4 botones segmentados (24h / 48h / 72h / 1 semana), default 48h.
  - **Cupo semanal por usuario**: stepper ± con número grande (default 3), explicación de que los que superen el límite tendrán prioridad menor.
  - **Reservas urgentes**: toggle + "3 por mes · Sólo a usuarios sin plaza".
  - **Notificaciones push**: toggle + "Sólo a usuarios sin cupo excedido".
- **Historial**: feed cronológico de eventos (usuario creado, reserva urgente, plaza liberada, contraseña restablecida, regla actualizada).

---

## Interactions & Behavior

### Navegación
- Tab bar persistente con 4 tabs + FAB central para "Liberar plaza" (abre bottom sheet).
- FAB es un botón circular 54px elevado (-14px translateY) con gradiente morado.
- Animaciones de bottom sheet: slide-up 260ms con easing `cubic-bezier(.2,.8,.3,1)`, backdrop fade-in 200ms.

### Flujo de reserva (por orden de llegada)
1. Usuario ve plazas liberadas en "Reservar".
2. Al pulsar "Reservar", se asigna inmediatamente la plaza concreta (con número).
3. La plaza aparece en "Hoy" como reserva confirmada.
4. Si otra persona ya la reservó → aparece como "Ocupada" con la opción "Urgente".

### Reserva urgente
- Solo puede desplazar a usuarios **sin plaza fija**.
- Consume 1 de los "urgentes mensuales" (default 3/mes).
- Requiere motivo (visible para admin).
- El usuario desplazado recibe notificación.

### Cupo semanal
- Admin define N reservas/semana (default 3).
- Cuando usuario excede → su prioridad baja. Otros usuarios pueden desplazar sus reservas (reserva urgente).
- La UI muestra barras consumidas + warning cuando está al límite.

### Antelación de reserva
- Admin define (default 48h). Usuarios no pueden reservar con más antelación.
- Días fuera del rango aparecen deshabilitados.

### Notificaciones
- **Principal**: aviso cuando alguien libera plaza (push + email).
- Configurable por usuario en Perfil.

### Casos especiales
- **Plaza compartida**: plaza 21 (P-2) compartida entre Javi Pérez y Santi (ambos tienen moto, caben 2). El modelo debe permitir N usuarios por plaza con flag `isShared` y `sharedWith: string[]`.
- **Servicio**: plaza 47 (P-2) marcada como "Carga y descarga", no reservable.
- **Moto**: flag `isMoto` para indicar visualmente que es plaza de moto.

### Recuperación de contraseña
Flujo estándar (no diseñado, pendiente):
1. "Olvidé mi contraseña" en login → email.
2. Email con link de un solo uso (token 24h).
3. Formulario de nueva contraseña.
4. Admin también puede forzar reset desde el detalle del usuario.

---

## State Management

### Datos principales (modelo de dominio sugerido)
```ts
type Role = 'fixed' | 'floating' | 'admin' | 'guest';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plate?: string;
  role: Role;
  status: 'active' | 'pending' | 'disabled';
  assignedPlazaId?: string;   // null para 'floating'
  sharedWith?: string[];      // userIds si plaza compartida
  avatarColor: string;
};

type Plaza = {
  id: string;            // e.g. "P-2-R-I-25"
  floor: 'P-1' | 'P-2';
  num: number;
  bay: 'top' | 'left' | 'mid' | 'right';
  col?: 'outer' | 'inner';
  row: number;
  ownerId?: string;      // user con plaza fija
  isShared?: boolean;
  sharedWith?: string[];
  isService?: boolean;
  isMoto?: boolean;
  isRamp?: boolean;
};

type Liberation = {
  id: string;
  plazaId: string;
  date: string;          // YYYY-MM-DD
  halfDay: 'full' | 'am' | 'pm';
  recurrenceId?: string; // si viene de una regla recurrente
};

type Reservation = {
  id: string;
  plazaId: string;
  userId: string;
  date: string;
  halfDay: 'full' | 'am' | 'pm';
  status: 'confirmed' | 'displaced';
  urgent?: boolean;
  reason?: string;
  createdAt: string;
};

type AdminRules = {
  advanceBookingHours: number;     // default 48
  weeklyQuotaPerUser: number;      // default 3
  monthlyUrgentQuota: number;      // default 3
  notifyOnLiberation: boolean;     // default true
};
```

### Endpoints sugeridos (REST)
```
POST   /auth/login
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /me
PUT    /me
PUT    /me/password

GET    /plazas?floor=P-1|P-2
GET    /plazas/:id
GET    /plazas/availability?date=YYYY-MM-DD

POST   /liberations         body: { plazaId, dates[], halfDay }
DELETE /liberations/:id

GET    /reservations?date=
POST   /reservations        body: { plazaId, date, halfDay }
POST   /reservations/urgent body: { plazaId, date, halfDay, reason }
DELETE /reservations/:id

/* Admin */
GET    /admin/users
POST   /admin/users
PUT    /admin/users/:id
DELETE /admin/users/:id
POST   /admin/users/:id/reset-password
GET    /admin/rules
PUT    /admin/rules
GET    /admin/audit-log
```

---

## Assets
- **Planos fuente**: `reference/Planta-1.jpeg` y `reference/Planta-2.jpeg` (PDFs originales convertidos a imagen). Son la referencia exacta del layout SVG.
- **Iconos**: todos SVG inline en `design/src/tokens.jsx` (objeto `Icon`). Se pueden reemplazar por `lucide-react` en implementación real. Mapeo:
  - `home → Home`, `calendar → Calendar`, `map → Map`, `user → User`, `bell → Bell`, `check → Check`, `close → X`, `car → Car`, `key → Key`, `bolt → Zap`, `clock → Clock`, `shield → Shield`, `settings → Settings`, `logout → LogOut`, `moon → Moon`, `lock → Lock`, `mail → Mail`, `phone → Phone`, `trash → Trash2`, `edit → Pencil`, `search → Search`, `sun → Sun`, `info → Info`, `repeat → RotateCw`, `users → Users`, `flag → Flag`
- **Fuentes**: Plus Jakarta Sans via Google Fonts.

## Files (en `design/`)
- `Aptica Parking.html` — entry point
- `src/tokens.jsx` — colores, tipografía, iconos
- `src/data.jsx` — modelo de datos mock (plazas, usuarios, reservas); referencia del algoritmo que construye las plantas P-1 y P-2
- `src/ui.jsx` — primitives (Button, Card, Badge, Avatar, Toggle, Row, SectionTitle, BottomSheet, Input)
- `src/calendar.jsx` — Calendar (multi/range) + WeekStrip
- `src/map.jsx` — SVG del parking con las dos plantas
- `src/screen-home.jsx` — Pantalla Hoy
- `src/screens.jsx` — Liberate sheet, Reservar, Mapa, Perfil
- `src/screen-admin.jsx` — Admin (usuarios, reglas, historial)
- `src/app.jsx` — App shell, tab bar, Tweaks

## Recomendaciones para implementación
1. **Empezar por el modelo de datos y auth** antes que la UI.
2. **Usar un calendario accesible** (`react-day-picker` o `@internationalized/date` + headless) en vez de reimplementar.
3. **Mapa del parking**: exportar las coordenadas de plazas como JSON y renderizar con React + SVG. Las plazas son clickables.
4. **Responsive**: el diseño actual es mobile-first. En desktop, convertir la tab bar en sidebar y las bottom sheets en modales centrados o drawers laterales.
5. **Fechas y zona horaria**: todo en Europe/Madrid. Usar `date-fns-tz` o `Luxon`.
6. **Pruebas prioritarias**: reglas de negocio (cupo, urgente, antelación), no solo componentes.
