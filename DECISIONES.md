# Decisiones de diseño

## Alcance de esta entrega

Se implementó **únicamente el backend**, a solicitud explícita para esta primera entrega. El frontend en React/Next descrito en la prueba **no está implementado**. Si se retoma con más tiempo, se abordaría como una app Next.js consumiendo esta API vía fetch/axios, con una tabla o grid de casilleros, badges de color por estado y un formulario de login de administrador que guarde el JWT (ej. en memoria o cookie httpOnly).

## Stack elegido

- **NestJS** (Node.js + TypeScript) como pide el enunciado.
- **TypeORM** como ORM, por su integración nativa y madura con NestJS (`@nestjs/typeorm`).
- **SQLite** como base de datos SQL. Se eligió sobre PostgreSQL/MySQL porque:
  - No requiere levantar un servicio de base de datos aparte, lo que facilita evaluar el proyecto rápidamente (`npm install && npm run seed && npm run start:dev` y ya funciona).
  - Es un archivo único, fácil de versionar/resetear durante desarrollo.
  - Sigue siendo SQL relacional, cumpliendo el requisito. El esquema (columnas, tipos, relaciones) es portable a Postgres/MySQL sin cambios de diseño relevantes; solo cambiaría la config de conexión en `app.module.ts`.

## Modelo de datos

- **Locker** (`id`, `code`, `size`, `doorStatus`, `occupancyStatus`, `createdAt`, `updatedAt`).
- **Reservation** (`id`, `lockerId` FK, `reservedBy`, `startTime`, `endTime`, `createdAt`), relación `ManyToOne` con `Locker`.
- **User** (`id`, `username`, `passwordHash`, `role`, `createdAt`) — representa administradores.

### Estado del casillero como dos dimensiones independientes

Se modelaron `doorStatus` (`abierto` / `cerrado`) y `occupancyStatus` (`ocupado` / `vacio`) como **dos columnas separadas** en vez de un único campo "estado" con 4 valores combinados. Motivos:

- Son conceptualmente independientes (la puerta es un estado físico momentáneo; la ocupación es un estado de negocio).
- Permite actualizar una sola dimensión sin tener que recalcular la otra.
- Facilita agregar más dimensiones de estado en el futuro (ej. "en mantenimiento") sin reestructurar todo.

**Supuesto sobre coherencia entre las dos dimensiones:** el enunciado pide "no permitir estados inconsistentes" pero no define qué combinación es inválida. Se asumió la siguiente regla de negocio, la más intuitiva en un locker físico real:

> Un casillero **no puede** quedar marcado como `ocupado` mientras su puerta está `abierto`. Para "ocupar" un casillero se asume que el usuario ya guardó sus pertenencias y cerró la puerta.

El resto de combinaciones son válidas: `vacio` + `abierto` (casillero disponible, alguien lo está revisando), `vacio` + `cerrado` (disponible, default), `ocupado` + `cerrado` (en uso). Esta validación vive en `LockersService.assertConsistentState()` y se ejecuta en cada `PATCH /lockers/:id/status`.

## Autenticación / autorización

- JWT simple con `passport-jwt`. Un único rol, `admin` (se dejó el campo `role` en `User` pensando en extensibilidad, aunque hoy solo existe ese rol).
- **Supuesto:** el enunciado no aclara si hay uno o varios administradores. Se modeló `User` como tabla, permitiendo múltiples administradores. El primer admin se crea con el script de seed (`npm run seed`); a partir de ahí, nuevos administradores se crean vía `POST /auth/register`.
- Solo los endpoints que **modifican** el estado de un casillero (`POST /lockers`, `PATCH /lockers/:id/status`) y el registro de nuevos administradores (`POST /auth/register`) están protegidos con `JwtAuthGuard` + `RolesGuard(Role.ADMIN)`. Los `GET` son públicos, ya que el frontend necesita mostrar el listado a cualquier visitante.
- **Supuesto sobre el registro:** se decidió que `POST /auth/register` **requiera estar autenticado como admin** (en vez de ser público), para que no cualquier persona pueda autoregistrarse con permisos de administrador sobre los casilleros. El "primer" admin siempre se crea vía seed/script, fuera de la API pública. Con más tiempo, se agregaría un flujo de invitación (token de un solo uso) en vez de requerir que un admin exista de antemano para crear al siguiente.
- Las contraseñas se guardan con `bcrypt` (hash + salt), nunca en texto plano.

## Reservas / agendamiento

- **Supuesto:** el enunciado no especifica si el agendamiento requiere autenticación de un "cliente". Se modeló como un endpoint **público**, identificando al reservante con un campo de texto libre `reservedBy` (nombre de la persona), en vez de crear un sistema completo de usuarios/clientes que estaba fuera del alcance mínimo descrito. Con más tiempo, esto se convertiría en una entidad `Customer` con su propio login.
- La validación de no-solapamiento se hace a nivel de servicio con una consulta que compara rangos (`startTime < endTimeSolicitado AND endTime > startTimeSolicitado`), el algoritmo estándar de detección de overlap de intervalos.
- No se vinculó la reserva con `occupancyStatus`/`doorStatus` (son conceptos distintos: la reserva es "quién tiene el casillero agendado en qué horario", el estado físico es "qué está pasando con el casillero ahora"). Con más tiempo, se podría automatizar que al iniciar una reserva el sistema sugiera marcar el casillero como `ocupado`.

## Arquitectura / organización de carpetas

Un módulo de Nest por dominio (`auth`, `users`, `lockers`, `reservations`), cada uno con su `entity`, `dto/`, `service`, `controller` y `module`. Enums compartidos en `common/enums`. Esto sigue el patrón idiomático de NestJS (separación por *feature module*) y facilita ubicar responsabilidades.

## Migraciones

Se usó `synchronize: true` de TypeORM en vez de migraciones formales, por el tiempo acotado de la prueba: TypeORM genera el esquema automáticamente a partir de las entidades al arrancar. **Esto es aceptable solo en desarrollo/demo.** Con más tiempo, se generarían migraciones explícitas (`typeorm migration:generate`) para tener control de versión del esquema, requisito real en un entorno productivo.

## Qué no se alcanzó a implementar

- **Frontend completo** (React/Next) — fuera de alcance de esta entrega según lo solicitado.
- **Migraciones formales** de base de datos (se usa `synchronize`, ver arriba).
- **Flujo de invitación/recuperación de contraseña** para administradores (hoy el registro requiere ya estar autenticado como admin, y no hay reseteo de contraseña).
- **Tests e2e** (solo hay un test unitario de la regla de negocio central de `lockers`).
- **Paginación** en `GET /lockers` y `GET /reservations` (no crítico dado el tamaño esperado del dataset, pero sería necesario en producción).
- **Endpoint para cancelar/editar una reserva existente.**
- **Vínculo automático entre reserva activa y `occupancyStatus`** (hoy son independientes, ver sección de Reservas).

## Cómo levantar el proyecto

Ver `README.md` para instrucciones completas (instalación, seed, arranque, Docker, PM2, ejemplos de curl).
