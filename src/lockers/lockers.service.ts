import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoorStatus, OccupancyStatus } from '../common/enums/locker.enums';
import { CreateLockerDto } from './dto/create-locker.dto';
import { UpdateLockerStatusDto } from './dto/update-locker-status.dto';
import { Locker } from './locker.entity';

@Injectable()
export class LockersService {
  constructor(
    @InjectRepository(Locker)
    private readonly lockersRepository: Repository<Locker>,
  ) {}

  findAll(): Promise<Locker[]> {
    return this.lockersRepository.find({ order: { code: 'ASC' } });
  }

  async findOne(id: number): Promise<Locker> {
    const locker = await this.lockersRepository.findOne({ where: { id } });
    if (!locker) {
      throw new NotFoundException(`Casillero con id ${id} no encontrado`);
    }
    return locker;
  }

  async create(dto: CreateLockerDto): Promise<Locker> {
    const existing = await this.lockersRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Ya existe un casillero con código ${dto.code}`);
    }
    const locker = this.lockersRepository.create(dto);
    return this.lockersRepository.save(locker);
  }

  async updateStatus(id: number, dto: UpdateLockerStatusDto): Promise<Locker> {
    const locker = await this.findOne(id);

    const nextDoorStatus = dto.doorStatus ?? locker.doorStatus;
    const nextOccupancyStatus = dto.occupancyStatus ?? locker.occupancyStatus;

    this.assertConsistentState(nextDoorStatus, nextOccupancyStatus);

    locker.doorStatus = nextDoorStatus;
    locker.occupancyStatus = nextOccupancyStatus;

    return this.lockersRepository.save(locker);
  }

  /**
   * Regla de negocio (ver DECISIONES.md): un casillero no puede quedar
   * marcado como OCUPADO mientras su puerta está ABIERTA. Se asume que
   * "ocupar" implica que el usuario ya guardó sus pertenencias y cerró
   * la puerta. Cualquier otra combinación de las dos dimensiones
   * (puerta / ocupación) es válida.
   */
  private assertConsistentState(door: DoorStatus, occupancy: OccupancyStatus) {
    if (door === DoorStatus.ABIERTO && occupancy === OccupancyStatus.OCUPADO) {
      throw new BadRequestException(
        'Estado inconsistente: un casillero no puede estar OCUPADO con la puerta ABIERTA. ' +
          'Cierre la puerta para poder marcarlo como ocupado.',
      );
    }
  }
}
