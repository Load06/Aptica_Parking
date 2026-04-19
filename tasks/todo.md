# Aptica Parking — Plan de implementación

## Stack decidido
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- **Auth**: JWT (access token 15min + refresh token 7d) + bcrypt
- **Email**: Resend (solo reset de contraseña)
- **Push**: Web Push API + Service Worker (PWA, prioritario sobre email)
- **Iconos**: lucide-react
- **Calendario**: react-day-picker v8
- **Fechas**: date-fns + date-fns-tz (Europe/Madrid)
- **Deploy**: Railway (backend + PostgreSQL + frontend estático)

## Estructura de carpetas
```
aptica-parking/
  backend/          ← Express + Prisma
  frontend/         ← Vite + React + Tailwind
  railway.toml      ← config multi-service
```

---

## Fase 1 — Scaffolding y estructura base
- [ ] Crear estructura de carpetas del monorepo
- [ ] Init backend: `npm init`, Express, TypeScript, Prisma, dependencias
- [ ] Init frontend: `npm create vite`, Tailwind, React Router, lucide-react, react-day-picker
- [ ] Configurar `railway.toml` para dos servicios (backend + frontend)

## Fase 2 — Modelo de datos (Prisma schema)
- [ ] Definir schema Prisma: User, Plaza, Liberation, Reservation, Recurrence, AdminRules, AuditLog, PushSubscription
- [ ] Seed: plazas P-1 y P-2 (algoritmo del diseño portado a TypeScript)
- [ ] Seed: usuarios con plaza fija (tabla del cliente, dominio @aptica.es)
  - P-1·15 Carolina Sáez              carolina.saez@aptica.es
  - P-1·16 Jose Ramón Saez            jramon.saez@aptica.es
  - P-1·17 Juan Mauricio Gonzalez     jmauricio.gonzalez@aptica.es
  - P-1·19 Furgo APTICA               (plaza de empresa, sin usuario)
  - P-2·20 Jesús Silveira             jesus.silveira@aptica.es
  - P-2·21 Javi Pérez (compartida)    javier.perez@aptica.es
  - P-2·21 Santiago Sopelana (comp.)  santiago.sopelana@aptica.es
  - P-2·22 Jose Vicente               josev.rodriguez@aptica.es
  - P-2·25 Javier Peñín               javier.penin@aptica.es
  - P-2·41 Agustín Gómez              agustin.gomez@aptica.es
  - P-2·42 Javier de Paz              javier.depaz@aptica.es
  - P-2·43 Josué López                josue.lopez@aptica.es
  - P-2·47 Carga y Descarga           (servicio, no reservable, sin usuario)
- [ ] Provisionar PostgreSQL en Railway y conectar `.env`

## Fase 3 — API de autenticación
- [ ] `POST /auth/register` → crea usuario con status `pending`
- [ ] `POST /auth/login` → devuelve JWT access + refresh token
- [ ] `POST /auth/refresh` → renueva access token
- [ ] `POST /auth/logout` → invalida refresh token
- [ ] `POST /auth/forgot-password` → envía email de reset (Resend)
- [ ] `POST /auth/reset-password` → valida token único 24h y cambia contraseña
- [ ] Middleware de autenticación (`verifyJWT`) y de rol (`requireRole`)

## Fase 4 — API core (plazas, liberaciones, reservas, admin)
- [ ] `GET /plazas` — lista con estado del día (disponible/liberada/ocupada)
- [ ] `GET /plazas/availability?date=` — disponibilidad por fecha
- [ ] `POST /liberations` — liberar plaza (días sueltos, rango, recurrente)
- [ ] `DELETE /liberations/:id` — cancelar liberación
- [ ] `GET /reservations?date=` — reservas del día/semana
- [ ] `POST /reservations` — reservar plaza (respeta cupo semanal y antelación 48h)
- [ ] `POST /reservations/urgent` — reserva urgente con motivo
- [ ] `DELETE /reservations/:id` — cancelar reserva
- [ ] `GET /admin/users` + `POST` + `PUT` + `DELETE` — gestión de usuarios
- [ ] `POST /admin/users/:id/approve` — aprobar usuario pendiente
- [ ] `POST /admin/users/:id/reset-password` — forzar reset desde admin
- [ ] `GET/PUT /admin/rules` — reglas globales (cupo, antelación, urgentes/mes)
- [ ] `GET /admin/audit-log` — historial de eventos
- [ ] `POST /push/subscribe` — guardar suscripción Web Push del dispositivo
- [ ] Trigger de notificación push al crear liberación

## Fase 5 — Frontend: base y diseño
- [ ] Configurar design tokens en Tailwind (`tailwind.config.ts`): colores, fuentes, radios, sombras
- [ ] Importar Plus Jakarta Sans (Google Fonts)
- [ ] Componentes UI base: Button, Card, Badge, Avatar, Toggle, Input, BottomSheet, SectionTitle
- [ ] Layout shell: Tab bar móvil (4 tabs + FAB central), sidebar desktop
- [ ] PWA: `manifest.json` + service worker base

## Fase 6 — Pantalla Login / Auth
- [ ] Pantalla de Login (email + contraseña, link "Olvidé contraseña")
- [ ] Pantalla de Registro (nombre, email, matrícula, contraseña)
- [ ] Pantalla "Pendiente de aprobación" (estado post-registro)
- [ ] Flujo de reset de contraseña (email → formulario nueva contraseña)

## Fase 7 — Pantalla Home
- [ ] Hero card variante `fixed` (plaza con gradiente morado, botones Liberar + Mapa)
- [ ] Hero card variante `floating` con y sin reserva
- [ ] Hero card variante `admin` (3 stats)
- [ ] Hero card variante `guest`
- [ ] Week strip (14 días, selección, hoy destacado)
- [ ] Feed de actividad reciente con botón "Reservar" (floating)
- [ ] Accesos rápidos (fixed)

## Fase 8 — Sheet Liberar plaza
- [ ] Segmented control: Días sueltos / Rango / Recurrente
- [ ] Calendario multi-selección y rango (react-day-picker)
- [ ] Selector de horario (3 chips: Día completo / Mañana / Tarde)
- [ ] Modo recurrente (día semana + hasta cuándo)
- [ ] Resumen de días seleccionados
- [ ] Integración con `POST /liberations`
- [ ] Trigger push al liberar

## Fase 9 — Pantalla Reservar
- [ ] Card de cupo semanal con barras y warning
- [ ] Week strip para elegir día
- [ ] Lista de plazas disponibles (con estado, titular, horario)
- [ ] Flujo de reserva normal (`POST /reservations`)
- [ ] Bottom sheet de reserva urgente con motivo (`POST /reservations/urgent`)

## Fase 10 — Pantalla Mapa
- [ ] SVG del parking P-1 y P-2 (portado de `design/src/map.jsx`)
- [ ] Tabs P-1 / P-2 (segmented control)
- [ ] Stats row (Libres / Liberadas / Ocupadas)
- [ ] Colores de estado en SVG (asignada, propia, liberada, servicio, moto, compartida)
- [ ] Bottom sheet de detalle al tocar plaza
- [ ] Leyenda

## Fase 11 — Pantalla Perfil
- [ ] Identity card (avatar, nombre, email, badges rol + plaza)
- [ ] Sección Cuenta: Datos personales, Matrícula, Contraseña
- [ ] Sección Notificaciones: toggles + activar Web Push del dispositivo
- [ ] Sección Administración (solo admin)
- [ ] Cerrar sesión (rojo)

## Fase 12 — Pantalla Admin
- [ ] Tab Usuarios: búsqueda + lista + badge "Pendiente"
- [ ] Sheet detalle usuario: editar rol/plaza/matrícula, aprobar, reset, eliminar
- [ ] Tab Reglas: antelación, cupo semanal (stepper), urgentes, notificaciones
- [ ] Tab Historial: feed de AuditLog
- [ ] Notificación push al admin cuando hay usuario pendiente de aprobación

## Fase 13 — Deploy en Railway
- [ ] Variables de entorno en Railway (DATABASE_URL, JWT_SECRET, RESEND_KEY, VAPID keys)
- [ ] Deploy backend como servicio Node.js
- [ ] Deploy frontend como servicio estático (build Vite)
- [ ] Smoke test en URL de Railway

---

## Revisión final
_(se rellena al terminar)_
