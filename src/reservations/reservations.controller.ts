import { Body, Controller, Get, Post, Param,ParseIntPipe, Query} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.entity';
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  
  @Get()
  async findAll(): Promise<Reservation[]> {
    return await this.reservationsService.findAll();
  }
  @Get('user/:reservedBy')
  async findByUser(@Param('reservedBy') reservedBy: string): Promise<Reservation[]> {
    return await this.reservationsService.findByReservedBy(reservedBy);
  }

  
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Reservation> {
    return await this.reservationsService.findOne(id);
  }
  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }
}
