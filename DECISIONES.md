

## Alcances de esta entrega de pedidos

Se implementó Una app Nest.js Backend Escalable y resiliente.
## Stack elegido

- **NestJS v10.3.0** version estable.
- **TypeORM** ORM.
- **SQLite** como base de datos SQL. porque:
  - No requiere levantar un servicio de base de datos aparte, lo que facilita evaluar el proyecto rápidamente.
  - Es un archivo único, fácil de versionar/resetear durante desarrollo.
  - Sigue siendo SQL relacional, cumpliendo el requisito.

## Modelo de datos

- **Locker** (`id`, `code`, `size`, `doorStatus`, `occupancyStatus`, `createdAt`, `updatedAt`,`reservation`,`isMaintenance`).
- **Reservation** (`id`, `lockerId` FK, `reservedBy`, `startTime`, `reservedBy` ,`endTime`, `createdAt`,`note`), relación `ManyToOne` con `Locker`.
- **User** (`id`, `username`, `passwordHash`, `role`, `createdAt`) — representa administradores.

### Estado del casillero como dos dimensiones independientes

Se modelaron `doorStatus` (`abierto` / `cerrado`), `occupancyStatus` (`ocupado` / `vacio`)  y  un estado del locker como `isMaintenance` como ** columnas separadas** en vez de un único campo "estado" con 4 valores combinados. Motivos:

- la puerta es un estado físico momentáneo; la ocupación es un estado de negocio.
- Permite actualizar una sola dimensión sin tener que recalcular la otra.
- Facilita agregar más dimensiones de estado en el futuro sin reestructurar todo.

**Supuesto sobre coherencia entre las dos dimensiones:** Se asumió la siguiente regla de negocio, la más intuitiva en un locker físico real:

> Un casillero **no puede** quedar marcado como `ocupado` mientras su puerta está `abierto`. Para "ocupar" un casillero se asume que el usuario ya guardó sus pertenencias y cerró la puerta.

El resto de combinaciones son válidas: `vacio` + `abierto` (casillero disponible, alguien lo está revisando), `vacio` + `cerrado` (disponible, default), `ocupado` + `cerrado` (en uso). Esta validación vive en `LockersService.assertConsistentState()` y se ejecuta en cada `PATCH /lockers/:id/status`.

## Autenticación / autorización

- JWT simple con `passport-jwt`. Un único rol, `admin` (se dejó el campo `role` en `User` pensando en extensibilidad, aunque hoy solo existe ese rol).
- **Supuesto:** el enunciado no aclara si hay uno o varios administradores. Se modeló `User` como tabla, permitiendo múltiples administradores. El primer admin se crea con el script de seed (`npm run seed`); a partir de ahí, nuevos administradores se crean vía `POST /auth/register`.
- Solo los endpoints que **modifican** el estado de un casillero (`POST /lockers`, `PATCH /lockers/:id/status`),el registro de nuevos usuarios (`POST /auth/register-user`) no esta protegido es publico para los nuevos usuarios entrantes y el registro de nuevos administradores (`POST /auth/register`) están protegidos con `JwtAuthGuard` + `RolesGuard(Role.ADMIN)`. Los `GET` son públicos, ya que el frontend necesita mostrar el listado a cualquier visitante.
- **Supuesto sobre el registro:** se decidió que `POST /auth/register` **requiera estar autenticado como admin** (en vez de ser público), para que no cualquier persona pueda autoregistrarse con permisos de administrador sobre los casilleros. El "primer" admin siempre se crea vía seed/script, fuera de la API pública. Con más tiempo, se agregaría un flujo de invitación (token de un solo uso) en vez de requerir que un admin exista de antemano para crear al siguiente.
- Las contraseñas se guardan con `bcrypt` (hash + salt), nunca en texto plano.

## Reservas / agendamiento

- **Supuesto:** Se modeló como un endpoint **público** donde nuevos usuarios podrían registrarse y iniciar sesion para reservar algunos de los diferentes lockers y ver sus lockers reservados, identificando al reservante con un campo de texto unico   `reservedBy` (email).
- La validación de no-solapamiento se hace a nivel de servicio con una consulta que compara rangos (`startTime < endTimeSolicitado AND endTime > startTimeSolicitado`), el algoritmo estándar de detección de overlap de intervalos.
- Use el paquete @nestjs/schedule para gestionar el ciclo de vida de las reservaciones de forma automatizada para que el sistema evalué periódicamente (ej. cada hora o a la medianoche) la base de datos para ejecutar acciones automáticas como: El cambio de estado de un locker a 'ocupado' cuando llegue la hora y fecha exacta cuando se reservo este

## Arquitectura / organización de carpetas

Un módulo de Nest por dominio (`auth`, `users`, `lockers`, `reservations`), cada uno con su `entity`, `dto/`, `service`, `controller` y `module`. Enums compartidos en `common/enums`. Esto sigue el patrón idiomático de NestJS (separación por *feature module*) y facilita ubicar responsabilidades.


## Cómo levantar el proyecto

Ver `README.md` para instrucciones completas (instalación, seed, arranque, Docker, PM2).
