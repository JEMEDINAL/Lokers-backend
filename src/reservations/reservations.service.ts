import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locker } from '../lockers/locker.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Reservation } from './reservation.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
    @InjectRepository(Locker)
    private readonly lockersRepository: Repository<Locker>,
  ) {}

  findAll(): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      relations: ['locker'],
      order: { startTime: 'ASC' },
    });
  }

  findByLocker(lockerId: number): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      where: { lockerId },
      order: { startTime: 'ASC' },
    });
  }

  async create(dto: CreateReservationDto): Promise<Reservation> {
    const locker = await this.lockersRepository.findOne({ where: { id: dto.lockerId } });
    if (!locker) {
      throw new NotFoundException(`Casillero con id ${dto.lockerId} no encontrado`);
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('startTime debe ser anterior a endTime');
    }

    // Dos reservas del mismo casillero se solapan si una empieza antes de
    // que la otra termine y termina después de que la otra empieza.
    const overlapping = await this.reservationsRepository
      .createQueryBuilder('reservation')
      .where('reservation.lockerId = :lockerId', { lockerId: dto.lockerId })
      .andWhere('reservation.startTime < :endTime', { endTime })
      .andWhere('reservation.endTime > :startTime', { startTime })
      .getOne();

    if (overlapping) {
      throw new ConflictException(
        `El casillero ya tiene una reserva que se solapa con el horario solicitado (reserva #${overlapping.id})`,
      );
    }

    const reservation = this.reservationsRepository.create({
      lockerId: dto.lockerId,
      reservedBy: dto.reservedBy,
      startTime,
      endTime,
    });

    return this.reservationsRepository.save(reservation);
  }
}
