import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Locker } from '../lockers/locker.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Locker, (locker) => locker.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lockerId' })
  locker: Locker;

  @Column()
  lockerId: number;

  @Column()
  reservedBy: string;

  @Column()
  codeLoker:string

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  note:string;
}
