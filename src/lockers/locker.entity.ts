import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoorStatus, LockerSize, OccupancyStatus } from '../common/enums/locker.enums';
import { Reservation } from '../reservations/reservation.entity';

@Entity('lockers')
export class Locker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'varchar', enum: LockerSize })
  size: LockerSize;

  @Column({ type: 'varchar', enum: DoorStatus, default: DoorStatus.CERRADO })
  doorStatus: DoorStatus;

  @Column({ type: 'varchar', enum: OccupancyStatus, default: OccupancyStatus.VACIO })
  occupancyStatus: OccupancyStatus;

  @OneToMany(() => Reservation, (reservation) => reservation.locker)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isMaintenance: boolean;
}
