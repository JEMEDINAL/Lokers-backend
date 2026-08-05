# Backend — Sistema de Alquiler de Casilleros (Lockers)

Backend construido con **NestJS + TypeORM + SQLite**, para la prueba técnica de Desarrollador Full Stack.


## Requisitos

- Node.js 18+
- npm 9+

## 1. Instalación de dependecias necesarias y copia del de variables de entorno

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
| POST   | /auth/register-user        | NO   | Registra un nuevo usuario                     |
| GET    | /lockers              | No           | Lista todos los casilleros                                 |
| GET    | /lockers/:id          | No           | Detalle de un casillero                                    |
| POST   | /lockers              | Sí (admin)   | Crea un casillero nuevo                                    |
| PATCH  | /lockers/:id/status   | Sí (admin)   | Cambia `doorStatus` y/o `occupancyStatus`                  |
| DELETE | /lockers/:id          | Sí (admin)   | Elimina locker que no es necesario                         |
| GET    | /reservations         | No (Logueado) | Lista todas las reservas                                   |
| GET    |/reservations:reservedby | No (Logueado)| Listara las reservaciones del usuario                      |
| DELETE | /reservations/:id/end | No (Logueado)| Elimina o finaliza una reservación                         |
| POST   | /reservations         | No (Logueado)| Crea una reserva validando solapamiento de horarios        |
| PATCH  | /reservations/:id/open-door| No (Logueado)   | Cambia `doorStatus`                  |



```

Ver `DECISIONES.md` para el detalle de decisiones de diseño, supuestos y pendientes.
