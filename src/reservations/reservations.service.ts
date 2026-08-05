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
import { OccupancyStatus } from 'src/common/enums/locker.enums';

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

  async findByReservedBy(reservedBy: string): Promise<Reservation[]> {
  return await this.reservationsRepository.find({
    where: { reservedBy },
    relations: ['locker'],
  });
}

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
      relations: ['locker'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservación con ID ${id} no encontrada`);
    }

    return reservation;
  }

  async create(dto: CreateReservationDto): Promise<Reservation> {
    const locker = await this.lockersRepository.findOne({ where: { id: dto.lockerId } });
    
    if (!locker) {
      throw new NotFoundException(`Casillero con id ${dto.lockerId} no encontrado`);
    }
    locker.occupancyStatus = OccupancyStatus.OCUPADO
    this.lockersRepository.save(locker)

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('startTime debe ser anterior a endTime');
    }

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
    locker,                     
    lockerId: dto.lockerId,     
    reservedBy: dto.reservedBy,
    codeLoker: dto.lockerCode,  
    startTime,
    endTime,
    note: dto.note,
  });

    return this.reservationsRepository.save(reservation);
  }
}
