import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locker } from '../lockers/locker.entity';
import { DoorStatus, OccupancyStatus } from '../common/enums/locker.enums';
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

  async endReservation(id: number, requesterUsername: string): Promise<void> {
  const reservation = await this.findOne(id);

  if (reservation.reservedBy !== requesterUsername) {
    throw new BadRequestException('Esta reserva no te pertenece');
  }

  await this.lockersRepository.update(reservation.lockerId, {
    occupancyStatus: OccupancyStatus.VACIO,
    doorStatus: DoorStatus.CERRADO,
  });

  await this.reservationsRepository.remove(reservation);
}

  async openDoor(id: number, requesterUsername: string): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (reservation.reservedBy !== requesterUsername) {
      throw new BadRequestException('Esta reserva no te pertenece');
    }

    const now = new Date();
    if (now < reservation.startTime || now > reservation.endTime) {
      throw new BadRequestException('La reserva no está activa en este momento');
    }

    await this.lockersRepository.update(reservation.lockerId, {
      doorStatus: DoorStatus.ABIERTO,
    });

    return reservation;
  }
}