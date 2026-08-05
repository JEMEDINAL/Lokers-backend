import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Locker } from './lockers/locker.entity';
import { LockersModule } from './lockers/lockers.module';
import { Reservation } from './reservations/reservation.entity';
import { ReservationsModule } from './reservations/reservations.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || 'lockers.sqlite',
      entities: [Locker, Reservation, User],

      synchronize: true,
    }),
    LockersModule,
    ReservationsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
