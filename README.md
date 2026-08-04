# Backend — Sistema de Alquiler de Casilleros (Lockers)

Backend construido con **NestJS + TypeORM + SQLite**, para la prueba técnica de Desarrollador Full Stack.

> ⚠️ Este entregable cubre únicamente el **backend**, a pedido explícito. El frontend no está implementado — ver `DECISIONES.md`.

## Requisitos

- Node.js 18+
- npm 9+

## 1. Instalación

```bash
npm install
cp .env.example .env
```

## 2. Cargar datos iniciales (seed)

Crea un usuario administrador y 5 casilleros de ejemplo (S, M, L):

```bash
npm run seed
```

Imprime en consola las credenciales del administrador (por defecto `admin` / `admin1234`, configurables en `.env`).

## 3. Levantar el proyecto

```bash
npm run start:dev
```

Backend disponible en `http://localhost:3000`.

## Alternativa: Docker

```bash
docker-compose up --build
```

Luego, dentro del contenedor (o exponiendo el script), ejecuta el seed:

```bash
docker-compose exec backend node dist/database/seed.js
```

## Alternativa: PM2 (producción)

```bash
npm run build
npm run seed
pm2 start ecosystem.config.js
```

## Autenticación

`POST /auth/login`

```json
{ "username": "admin", "password": "admin1234" }
```

Devuelve un `access_token` (JWT) que se envía como `Authorization: Bearer <token>` en los endpoints protegidos.

## Endpoints

| Método | Ruta                 | Protegido    | Descripción                                              |
| ------ | -------------------- | ------------ | --------------------------------------------------------- |
| POST   | /auth/login           | No           | Login de administrador, devuelve JWT                      |
| POST   | /auth/register        | Sí (admin)   | Registra un nuevo usuario administrador                    |
| GET    | /lockers              | No           | Lista todos los casilleros                                 |
| GET    | /lockers/:id          | No           | Detalle de un casillero                                    |
| POST   | /lockers              | Sí (admin)   | Crea un casillero nuevo                                    |
| PATCH  | /lockers/:id/status   | Sí (admin)   | Cambia `doorStatus` y/o `occupancyStatus`                  |
| GET    | /reservations         | No           | Lista todas las reservas (o filtra por `?lockerId=`)       |
| POST   | /reservations         | No           | Crea una reserva validando solapamiento de horarios        |

## Ejemplos con curl

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'
```

**Cambiar estado (con token):**

```bash
curl -X PATCH http://localhost:3000/lockers/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"doorStatus":"cerrado","occupancyStatus":"ocupado"}'
```

**Registrar un nuevo administrador (con token de un admin existente):**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"username":"maria","password":"claveSegura123"}'
```

**Crear reserva:**

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{"lockerId":1,"reservedBy":"Juan Pérez","startTime":"2026-08-04T09:00:00.000Z","endTime":"2026-08-04T11:00:00.000Z"}'
```

## Tests

```bash
npm run test
```

Incluye un test unitario que verifica la regla de negocio central: un casillero no puede quedar `ocupado` con la puerta `abierto`.

## Estructura del proyecto

```
src/
├── auth/            # login, JWT strategy, guards de rol
├── users/           # entidad y servicio de usuarios (administradores)
├── lockers/         # entidad, controller, service de casilleros
├── reservations/     # entidad, controller, service de reservas
├── common/enums/     # enums compartidos (LockerSize, DoorStatus, OccupancyStatus, Role)
├── database/seed.ts  # script de datos iniciales
├── app.module.ts
└── main.ts
```

Ver `DECISIONES.md` para el detalle de decisiones de diseño, supuestos y pendientes.
