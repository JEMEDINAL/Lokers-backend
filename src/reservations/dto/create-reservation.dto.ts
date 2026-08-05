import { IsInt, IsString, MinLength, IsDateString, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  lockerId: number;

  @IsString()
  @MinLength(2)
  reservedBy: string;

  @IsString() 
  lockerCode: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  note?: string;
}