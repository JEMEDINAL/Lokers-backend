import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Locker } from '../lockers/locker.entity';
import { Reservation } from './reservation.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { LockerOccupancySchedulerService } from './lockerOccupancyScheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Locker])],
  controllers: [ReservationsController],
  providers: [ReservationsService,LockerOccupancySchedulerService],
})
export class ReservationsModule {}
