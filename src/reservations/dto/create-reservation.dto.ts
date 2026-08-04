import { IsDateString, IsInt, IsString, MinLength } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  lockerId: number;

  @IsString()
  @MinLength(2)
  reservedBy: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
