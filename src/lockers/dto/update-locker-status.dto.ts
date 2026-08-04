import { IsEnum, IsOptional } from 'class-validator';
import { DoorStatus, OccupancyStatus } from '../../common/enums/locker.enums';

export class UpdateLockerStatusDto {
  @IsOptional()
  @IsEnum(DoorStatus, { message: 'doorStatus debe ser "abierto" o "cerrado"' })
  doorStatus?: DoorStatus;

  @IsOptional()
  @IsEnum(OccupancyStatus, { message: 'occupancyStatus debe ser "ocupado" o "vacio"' })
  occupancyStatus?: OccupancyStatus;
}
