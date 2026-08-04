import { IsEnum, IsString, MinLength } from 'class-validator';
import { LockerSize } from '../../common/enums/locker.enums';

export class CreateLockerDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsEnum(LockerSize, { message: 'size debe ser S, M o L' })
  size: LockerSize;
}
