import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
//import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
//import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
//@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new booking',
    description: 'Create a new vehicle booking with the provided details',
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Booking successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid booking data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Vehicle already booked for the selected dates',
  })
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    // Use the user ID from the authenticated user if available, otherwise use the one provided in the DTO
    const bookingData = {
      ...createBookingDto,
      userId: req.user?.id || createBookingDto.userId,
    };
    return this.bookingService.create(bookingData);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Get all bookings',
    description: 'Retrieve all bookings with optional filters',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'vehicleId',
    required: false,
    description: 'Filter by vehicle ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date (ISO format)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all bookings matching filters',
  })
  findAll(
    @Query('userId') userId?: number,
    @Query('vehicleId') vehicleId?: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.bookingService.findAll({
      userId: userId ? +userId : undefined,
      vehicleId: vehicleId ? +vehicleId : undefined,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('my-bookings')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.STAFF)
  findMyBookings(@Request() req) {
    return this.bookingService.getUserBookings(req.user.id);
  }

  @Get('active')
  @Roles(Role.ADMIN, Role.STAFF)
  findActive() {
    return this.bookingService.getActiveBookings();
  }

  @Get('upcoming')
  @Roles(Role.ADMIN, Role.STAFF)
  findUpcoming() {
    return this.bookingService.getUpcomingBookings();
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.bookingService.getBookingStats();
  }

  @Get('vehicle/:vehicleId')
  @Roles(Role.ADMIN, Role.STAFF)
  findByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.bookingService.getVehicleBookings(vehicleId);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Get booking by ID',
    description: 'Retrieve a specific booking by its ID',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the booking' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Unauthorized access to this booking',
  })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user?.role === Role.CUSTOMER) {
      return this.bookingService.getUserBookingById(id, req.user.id);
    }
    return this.bookingService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingService.update(id, updateBookingDto);
  }

  @Patch(':id/cancel')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Cancel booking',
    description: 'Cancel a booking by ID',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for cancellation' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking successfully cancelled',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel this booking',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Unauthorized to cancel this booking',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const { reason } = body;

    if (req.user?.role === Role.CUSTOMER) {
      return this.bookingService.cancelUserBooking(id, req.user.id, reason);
    }
    return this.bookingService.cancelBooking(id, reason);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.remove(id);
  }

  @Get('availability/:vehicleId')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.STAFF)
  checkAvailability(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.bookingService.checkVehicleAvailability(
      vehicleId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
