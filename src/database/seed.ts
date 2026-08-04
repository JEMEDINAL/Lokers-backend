import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { LockerSize } from '../common/enums/locker.enums';
import { LockersService } from '../lockers/lockers.service';
import { UsersService } from '../users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const lockersService = app.get(LockersService);

  const adminUsername = process.env.SEED_ADMIN_USER || 'admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin1234';

  const existingAdmin = await usersService.findByUsername(adminUsername);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await usersService.create({ username: adminUsername, passwordHash });
    console.log(`✔ Usuario administrador creado: ${adminUsername} / ${adminPassword}`);
  } else {
    console.log('ℹ Usuario administrador ya existe, se omite creación');
  }

  const existingLockers = await lockersService.findAll();
  if (existingLockers.length === 0) {
    const seedLockers = [
      { code: 'S-01', size: LockerSize.S },
      { code: 'S-02', size: LockerSize.S },
      { code: 'M-01', size: LockerSize.M },
      { code: 'M-02', size: LockerSize.M },
      { code: 'L-01', size: LockerSize.L },
    ];
    for (const locker of seedLockers) {
      await lockersService.create(locker);
    }
    console.log(`✔ ${seedLockers.length} casilleros de ejemplo creados`);
  } else {
    console.log('ℹ Ya existen casilleros, se omite creación de datos de ejemplo');
  }

  await app.close();
}

bootstrap();
