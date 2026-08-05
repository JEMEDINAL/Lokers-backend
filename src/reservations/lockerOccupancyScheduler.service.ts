import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Locker } from '../lockers/locker.entity';
import { Reservation } from './reservation.entity';
import { OccupancyStatus } from 'src/common/enums/locker.enums';

@Injectable()
export class LockerOccupancySchedulerService {
  constructor(
    @InjectRepository(Locker)
    private readonly lockersRepository: Repository<Locker>,
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncOccupancy() {
    const now = new Date();

    const activeReservations = await this.reservationsRepository.find({
      where: {
        startTime: LessThanOrEqual(now),
        endTime: MoreThan(now),
      },
    });
    const activeLockerIds = new Set(activeReservations.map((r) => r.lockerId));

    const lockers = await this.lockersRepository.find();

    for (const locker of lockers) {
      if (locker.isMaintenance) continue; 

      const targetStatus = activeLockerIds.has(locker.id)
        ? OccupancyStatus.OCUPADO
        : OccupancyStatus.VACIO;

      if (locker.occupancyStatus !== targetStatus) {
        locker.occupancyStatus = targetStatus;
        await this.lockersRepository.save(locker);
      }
    }
  }
}