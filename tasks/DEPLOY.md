# Deploy en Railway — Aptica Parking

## Pasos

### 1. Crear repositorio Git
```bash
cd /ruta/al/proyecto
git init
git add .
git commit -m "Initial commit"
```
Sube a GitHub (privado).

### 2. Railway — crear proyecto
1. railway.app → New Project → Deploy from GitHub → elige el repo
2. Railway detectará la carpeta `backend/` automáticamente

### 3. Añadir PostgreSQL
Railway → tu proyecto → Add Service → Database → PostgreSQL
La variable `DATABASE_URL` se inyectará automáticamente al backend.

### 4. Variables de entorno (backend service)
En Railway → backend service → Variables, añade:

| Variable             | Valor                              |
|----------------------|------------------------------------|
| `JWT_SECRET`         | (cadena aleatoria larga, 64+ chars)|
| `JWT_REFRESH_SECRET` | (otra cadena aleatoria larga)      |
| `RESEND_API_KEY`     | re_xxxxxxx (de tu cuenta Resend)   |
| `FRONTEND_URL`       | https://tu-frontend.up.railway.app |
| `VAPID_PUBLIC_KEY`   | BC7kP2779PN4sqeP3wWplwPWjb9fULW7ZfbOArSWsmp4EedIM9HYLnQWl7gfeAhoibRIHWWIp0-J28_8Yjxd9tg |
| `VAPID_PRIVATE_KEY`  | JY3AVGwGp0LcQhIvekjBbWhlZrPFFfYm90gqjE5sA0c |

> ⚠️ VAPID_PRIVATE_KEY debe mantenerse en secreto.

### 5. Variable de entorno (frontend service)
| Variable       | Valor                                      |
|----------------|--------------------------------------------|
| `VITE_API_URL` | https://tu-backend.up.railway.app          |

Añade en `frontend/src/lib/api.ts`:
```ts
baseURL: import.meta.env.VITE_API_URL ?? '/api'
```

### 6. Inicializar la base de datos (una vez desplegado el backend)
```bash
# Desde tu máquina con DATABASE_URL del backend
cd backend
DATABASE_URL="postgresql://..." npm run db:push
DATABASE_URL="postgresql://..." npm run db:seed
```
O ejecuta estos comandos desde la Railway CLI:
```bash
railway run --service backend npm run db:push
railway run --service backend npm run db:seed
```

### 7. Verificar
- `https://tu-backend.up.railway.app/health` → `{ "ok": true }`
- Abre el frontend → login como `admin@aptica.es` / `Admin1234!`
- Cambia la contraseña del admin inmediatamente

### 8. Resend — configurar dominio
En resend.com → Domains → Add domain → `aptica.es`
Añade los registros DNS que te indique. El email vendrá de `no-reply@aptica.es`.
