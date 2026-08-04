import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findAll(@Query('lockerId') lockerId?: string) {
    if (lockerId) {
      return this.reservationsService.findByLocker(parseInt(lockerId, 10));
    }
    return this.reservationsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }
}
