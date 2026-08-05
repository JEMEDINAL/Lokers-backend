import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }


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

  @UseGuards(JwtAuthGuard)
  @Delete(':id/end')
  async end(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { username: string } },
  ): Promise<void> {
    return this.reservationsService.endReservation(id, req.user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/open-door')
  async openDoor(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { username: string } },
  ): Promise<Reservation> {
    return this.reservationsService.openDoor(id, req.user.username);
  }
}
