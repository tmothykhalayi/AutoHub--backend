// src/modules/bookings/bookings.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../users/dto/pagination.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or vehicle not available',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle or user not found',
  })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(createBookingDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  async findAll(
    @Query() paginationDto?: PaginationDto,
  ): Promise<{ data: BookingResponseDto[]; pagination: any }> {
    return this.bookingsService.findAll(paginationDto);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  async getMyBookings(
    @Req() req: AuthenticatedRequest,
    @Query() paginationDto?: PaginationDto,
  ): Promise<{ data: BookingResponseDto[]; pagination: any }> {
    return this.bookingsService.findUserBookings(req.user.userId, paginationDto);
  }

  @Get('search')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Search bookings (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  async searchBookings(
    @Query() searchDto: SearchBookingsDto,
  ): Promise<{ data: BookingResponseDto[]; pagination: any }> {
    return this.bookingsService.searchBookings(searchDto);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get booking statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getBookingStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    return this.bookingsService.getBookingStats(startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.findOne(id);
    
    // Users can only access their own bookings unless they are admins
    if (req.user.role !== UserRole.ADMIN && booking.user_id !== req.user.userId) {
      throw new ForbiddenException('You can only access your own bookings');
    }
    
    return booking;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update booking in current status',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.findOne(id);
    
    // Users can only update their own bookings unless they are admins
    if (req.user.role !== UserRole.ADMIN && booking.user_id !== req.user.userId) {
      throw new ForbiddenException('You can only update your own bookings');
    }

    return this.bookingsService.update(id, updateBookingDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking cancelled successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel booking in current status',
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.findOne(id);
    
    // Users can only cancel their own bookings unless they are admins
    if (req.user.role !== UserRole.ADMIN && booking.user_id !== req.user.userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    return this.bookingsService.cancelBooking(id, cancelBookingDto.reason);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirm a booking (Admin only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking confirmed successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot confirm booking in current status',
  })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.confirmBooking(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark booking as completed (Admin only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking completed successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot complete booking in current status',
  })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.completeBooking(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete booking (Admin only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Booking deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete booking in current status',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.bookingsService.remove(id);
  }

  @Get('vehicle/:vehicleId/availability')
  @ApiOperation({ summary: 'Check vehicle availability' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle UUID' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability check completed',
  })
  async checkAvailability(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ available: boolean; conflictingBookings?: any[] }> {
    return this.bookingsService.checkVehicleAvailability(vehicleId, new Date(startDate), new Date(endDate));
  }

  @Get('upcoming/reminders')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get upcoming booking reminders (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reminders retrieved successfully',
  })
  async getUpcomingReminders(
    @Query('days', new DefaultValuePipe(1)) days: number,
  ): Promise<any[]> {
    return this.bookingsService.getUpcomingBookingReminders(days);
  }

  @Get('revenue/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get revenue statistics (Admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue statistics retrieved successfully',
  })
  async getRevenueStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string,
  ): Promise<any> {
    return this.bookingsService.getRevenueStats(startDate, endDate, groupBy);
  }

  @Post('bulk/confirm')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk confirm bookings (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk confirmation completed',
  })
  async bulkConfirm(
    @Body() body: { bookingIds: string[] },
  ): Promise<{ success: string[]; failed: { id: string; reason: string }[] }> {
    return this.bookingsService.bulkConfirmBookings(body.bookingIds);
  }

  @Post('bulk/cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk cancel bookings (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk cancellation completed',
  })
  async bulkCancel(
    @Body() body: { bookingIds: string[]; reason: string },
  ): Promise<{ success: string[]; failed: { id: string; reason: string }[] }> {
    return this.bookingsService.bulkCancelBookings(body.bookingIds, body.reason);
  }
}