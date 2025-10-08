// src/modules/bookings/bookings.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Like, In, Not, IsNull } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingStatus } from './entities/booking.entity';
import { PaginationDto } from '../users/dto/pagination.dto';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { LocationsService } from '../locations/locations.service';
import { PaymentsService } from '../payments/payments.service';
import { MailService } from '../mail/mail.service';
import * as moment from 'moment';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => VehiclesService))
    private vehiclesService: VehiclesService,
    private locationsService: LocationsService,
    private paymentsService: PaymentsService,
    private emailService: MailService,
  ) {}

  private mapToResponseDto(booking: Booking): BookingResponseDto {
    const { user, vehicle, location, payment, ...bookingData } = booking;
    return new BookingResponseDto({
      ...bookingData,
      user: user ? this.usersService.mapToResponseDto(user) : undefined,
      vehicle: vehicle ? { ...vehicle } : undefined,
      location: location ? this.locationsService.mapToResponseDto(location) : undefined,
      payment_info: payment ? {
        status: payment.status,
        amount: payment.amount,
        method: payment.paymentIntentId
      } : undefined,
    });
  }

  private calculateTotalAmount(
    dailyRate: number,
    startDate: Date,
    endDate: Date,
    insuranceOption?: string,
  ): number {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let total = dailyRate * days;

    // Apply insurance premiums
    if (insuranceOption === 'basic') {
      total += total * 0.1; // 10% premium
    } else if (insuranceOption === 'premium') {
      total += total * 0.2; // 20% premium
    }

    return parseFloat(total.toFixed(2));
  }

  async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string,
  ): Promise<{ available: boolean; conflictingBookings?: any[] }> {
    try {
      const where: any = {
        vehicle_id: vehicleId,
        booking_status: Not(In([BookingStatus.CANCELLED, BookingStatus.COMPLETED])),
        booking_date: LessThanOrEqual(endDate),
        return_date: MoreThanOrEqual(startDate),
      };

      if (excludeBookingId) {
        where.id = Not(excludeBookingId);
      }

      const conflictingBookings = await this.bookingsRepository.find({
        where,
        relations: ['user'],
      });

      return {
        available: conflictingBookings.length === 0,
        conflictingBookings: conflictingBookings.map(booking => ({
          booking_id: booking.id,
          booking_date: booking.booking_date,
          return_date: booking.return_date,
          user: booking.user ? booking.user.full_name : 'Unknown',
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to check vehicle availability');
    }
  }

  async create(createBookingDto: CreateBookingDto, userId: string): Promise<BookingResponseDto> {
    const queryRunner = this.bookingsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate user exists
      const user = await this.usersService.findOne(userId);
      if (!user.is_active) {
        throw new BadRequestException('User account is not active');
      }

      // Validate vehicle exists and is available
      const vehicle = await this.vehiclesService.findOne(createBookingDto.vehicle_id);
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      // Validate location exists
      await this.locationsService.findOne(createBookingDto.location_id);

      const startDate = new Date(createBookingDto.booking_date);
      const endDate = new Date(createBookingDto.return_date);

      // Validate dates
      if (startDate >= endDate) {
        throw new BadRequestException('Return date must be after booking date');
      }

      if (startDate < new Date()) {
        throw new BadRequestException('Booking date cannot be in the past');
      }

      // Check vehicle availability
      const availability = await this.checkVehicleAvailability(
        createBookingDto.vehicle_id,
        startDate,
        endDate,
      );

      if (!availability.available) {
        throw new ConflictException('Vehicle not available for the selected dates');
      }

      // Calculate total amount
      const totalAmount = this.calculateTotalAmount(
        vehicle.rentalRate,
        startDate,
        endDate,
        createBookingDto.insurance_option,
      );

      // Create booking
      const booking = queryRunner.manager.create(Booking, {
        user_id: userId,
        vehicle_id: createBookingDto.vehicle_id,
        location_id: createBookingDto.location_id,
        booking_date: startDate,
        return_date: endDate,
        total_amount: totalAmount,
        booking_status: BookingStatus.PENDING,
        special_requests: createBookingDto.special_requests,
        additional_drivers: createBookingDto.additional_drivers,
      });

      const savedBooking = await queryRunner.manager.save(booking);

      // Create pending payment
      await this.paymentsService.createPayment(
        savedBooking.id,
        totalAmount,
        userId,
      );

      await queryRunner.commitTransaction();

      // Send confirmation email
      // TODO: Fix email service parameters to match expected format
      // await this.emailService.sendBookingConfirmation(user.email, savedBooking);

      return this.mapToResponseDto(savedBooking);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create booking');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(paginationDto?: PaginationDto): Promise<{
    data: BookingResponseDto[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [bookings, total] = await this.bookingsRepository.findAndCount({
        relations: ['user', 'vehicle', 'location', 'payment'],
        skip,
        take: limit,
        order: { created_at: 'DESC' },
      });

      return {
        data: bookings.map(booking => this.mapToResponseDto(booking)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch bookings');
    }
  }

  async findOne(id: string): Promise<BookingResponseDto> {
    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id },
        relations: ['user', 'vehicle', 'location', 'payment'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      return this.mapToResponseDto(booking);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch booking');
    }
  }

  async findUserBookings(
    userId: string,
    paginationDto?: PaginationDto,
  ): Promise<{
    data: BookingResponseDto[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [bookings, total] = await this.bookingsRepository.findAndCount({
        where: { user_id: userId },
        relations: ['user', 'vehicle', 'location', 'payment'],
        skip,
        take: limit,
        order: { created_at: 'DESC' },
      });

      return {
        data: bookings.map(booking => this.mapToResponseDto(booking)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user bookings');
    }
  }

  //Updating bookings from the databa-se
  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<BookingResponseDto> {
    const queryRunner = this.bookingsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id },
        relations: ['user', 'vehicle', 'payment'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      // Check if booking can be modified
      if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.booking_status)) {
        throw new BadRequestException('Cannot modify booking in current status');
      }

      let needsRecalculation = false;
      let newTotalAmount = booking.total_amount;

      // Handle date changes
      if (updateBookingDto.booking_date || updateBookingDto.return_date) {
        const newStartDate = updateBookingDto.booking_date 
          ? new Date(updateBookingDto.booking_date) 
          : booking.booking_date;
        const newEndDate = updateBookingDto.return_date 
          ? new Date(updateBookingDto.return_date) 
          : booking.return_date;

        if (newStartDate >= newEndDate) {
          throw new BadRequestException('Return date must be after booking date');
        }

        // Check availability for new dates (excluding current booking)
        const availability = await this.checkVehicleAvailability(
          booking.vehicle_id,
          newStartDate,
          newEndDate,
          id,
        );

        if (!availability.available) {
          throw new ConflictException('Vehicle not available for the new dates');
        }

        needsRecalculation = true;
      }

      // Recalculate total amount if dates changed
      if (needsRecalculation) {
        const startDate = updateBookingDto.booking_date 
          ? new Date(updateBookingDto.booking_date) 
          : booking.booking_date;
        const endDate = updateBookingDto.return_date 
          ? new Date(updateBookingDto.return_date) 
          : booking.return_date;

        newTotalAmount = this.calculateTotalAmount(
          booking.vehicle.rentalRate,
          startDate,
          endDate,
        );
      }

      // Update booking
      Object.assign(booking, updateBookingDto);
      if (needsRecalculation) {
        booking.total_amount = newTotalAmount;
      }

      const updatedBooking = await queryRunner.manager.save(booking);

      // Update payment if amount changed
      if (needsRecalculation && booking.payment) {
        // TODO: Implement updatePaymentAmount method in PaymentsService
        // await this.paymentsService.updatePaymentAmount(
        //   booking.payment.id,
        //   newTotalAmount,
        // );
      }

      await queryRunner.commitTransaction();

      // Send update notification
      if (booking.user) {
        // TODO: Implement sendBookingUpdate method in MailService
        // await this.emailService.sendBookingUpdate(booking.user.email, updatedBooking);
      }

      return this.mapToResponseDto(updatedBooking);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update booking');
    } finally {
      await queryRunner.release();
    }
  }

  async cancelBooking(id: string, reason?: string): Promise<BookingResponseDto> {
    const queryRunner = this.bookingsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id },
        relations: ['user', 'payment'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      // Check if booking can be cancelled
      if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.booking_status)) {
        throw new BadRequestException('Cannot cancel booking in current status');
      }

      // Update booking status
      booking.booking_status = BookingStatus.CANCELLED;
      booking.cancellation_reason = reason;

      const updatedBooking = await queryRunner.manager.save(booking);

      // Process refund if payment was made
      if (booking.payment && booking.payment.status === 'completed') {
        // TODO: Implement processRefund method in PaymentsService
        // await this.paymentsService.processRefund(
        //   booking.payment.id,
        //   booking.total_amount,
        //   'Booking cancellation',
        // );
      }

      await queryRunner.commitTransaction();

      // Send cancellation notification
      if (booking.user) {
        // TODO: Implement sendBookingCancellation method in MailService
        // await this.emailService.sendBookingCancellation(booking.user.email, updatedBooking, reason);
      }

      return this.mapToResponseDto(updatedBooking);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to cancel booking');
    } finally {
      await queryRunner.release();
    }
  }

  async confirmBooking(id: string): Promise<BookingResponseDto> {
    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id },
        relations: ['user', 'vehicle'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      if (booking.booking_status !== BookingStatus.PENDING) {
        throw new BadRequestException('Only pending bookings can be confirmed');
      }

      // Check vehicle availability one more time
      const availability = await this.checkVehicleAvailability(
        booking.vehicle_id,
        booking.booking_date,
        booking.return_date,
        id,
      );

      if (!availability.available) {
        throw new ConflictException('Vehicle no longer available for the selected dates');
      }

      booking.booking_status = BookingStatus.CONFIRMED;
      const updatedBooking = await this.bookingsRepository.save(booking);

      // Update vehicle availability
      // Update vehicle availability
      // TODO: Implement updateAvailability method in VehiclesService
      // await this.vehiclesService.updateAvailability(booking.vehicle_id, false);

      // Send confirmation notification
      if (booking.user) {
        // TODO: Fix email service parameters to match expected format
        // await this.emailService.sendBookingConfirmation(booking.user.email, updatedBooking);
      }

      return this.mapToResponseDto(updatedBooking);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to confirm booking');
    }
  }

  async completeBooking(id: string): Promise<BookingResponseDto> {
    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id },
        relations: ['user', 'vehicle'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      if (booking.booking_status !== BookingStatus.ACTIVE) {
        throw new BadRequestException('Only active bookings can be completed');
      }

      booking.booking_status = BookingStatus.COMPLETED;
      const updatedBooking = await this.bookingsRepository.save(booking);

      // Update vehicle availability
      // Update vehicle availability
      // TODO: Implement updateAvailability method in VehiclesService
      // await this.vehiclesService.updateAvailability(booking.vehicle_id, true);

      // Send completion notification
      if (booking.user) {
        // TODO: Implement sendBookingCompletion method in MailService
        // await this.emailService.sendBookingCompletion(booking.user.email, updatedBooking);
      }

      return this.mapToResponseDto(updatedBooking);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to complete booking');
    }
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.bookingsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const booking = await this.bookingsRepository.findOne({
        where: { id },
        relations: ['payment'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      // Check if booking can be deleted
      if (![BookingStatus.CANCELLED, BookingStatus.COMPLETED].includes(booking.booking_status)) {
        throw new BadRequestException('Cannot delete booking in current status');
      }

      // Delete related payment first
      if (booking.payment) {
        await queryRunner.manager.delete('payments', { id: booking.payment.id });
      }

      // Delete booking
      await queryRunner.manager.delete(Booking, id);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete booking');
    } finally {
      await queryRunner.release();
    }
  }

  async searchBookings(searchDto: SearchBookingsDto): Promise<{
    data: BookingResponseDto[];
    pagination: any;
  }> {
    try {
      const { 
        userQuery, 
        vehicleQuery, 
        status, 
        user_id, 
        vehicle_id, 
        booking_date_after, 
        booking_date_before,
        return_date_after,
        return_date_before,
        page = 1, 
        limit = 10 
      } = searchDto;
      
      const skip = (page - 1) * limit;

      const query = this.bookingsRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.vehicle', 'vehicle')
        .leftJoinAndSelect('booking.location', 'location')
        .leftJoinAndSelect('booking.payment', 'payment');

      // Apply filters
      if (userQuery) {
        query.andWhere('(user.full_name LIKE :userQuery OR user.email LIKE :userQuery)', {
          userQuery: `%${userQuery}%`,
        });
      }

      if (vehicleQuery) {
        query.andWhere('(vehicle.manufacturer LIKE :vehicleQuery OR vehicle.model LIKE :vehicleQuery)', {
          vehicleQuery: `%${vehicleQuery}%`,
        });
      }

      if (status) {
        query.andWhere('booking.booking_status = :status', { status });
      }

      if (user_id) {
        query.andWhere('booking.user_id = :user_id', { user_id });
      }

      if (vehicle_id) {
        query.andWhere('booking.vehicle_id = :vehicle_id', { vehicle_id });
      }

      if (booking_date_after) {
        query.andWhere('booking.booking_date >= :booking_date_after', {
          booking_date_after: new Date(booking_date_after),
        });
      }

      if (booking_date_before) {
        query.andWhere('booking.booking_date <= :booking_date_before', {
          booking_date_before: new Date(booking_date_before),
        });
      }

      if (return_date_after) {
        query.andWhere('booking.return_date >= :return_date_after', {
          return_date_after: new Date(return_date_after),
        });
      }

      if (return_date_before) {
        query.andWhere('booking.return_date <= :return_date_before', {
          return_date_before: new Date(return_date_before),
        });
      }

      // Get total count
      const total = await query.getCount();

      // Apply pagination and ordering
      const bookings = await query
        .skip(skip)
        .take(limit)
        .orderBy('booking.created_at', 'DESC')
        .getMany();

      return {
        data: bookings.map(booking => this.mapToResponseDto(booking)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to search bookings');
    }
  }

  async getBookingStats(startDate?: string, endDate?: string): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const end = endDate ? new Date(endDate) : new Date();

      const stats = await this.bookingsRepository
        .createQueryBuilder('booking')
        .select('booking.booking_status', 'status')
        .addSelect('COUNT(booking.booking_id)', 'count')
        .addSelect('SUM(booking.total_amount)', 'revenue')
        .where('booking.created_at BETWEEN :start AND :end', { start, end })
        .groupBy('booking.booking_status')
        .getRawMany();

      const totalBookings = await this.bookingsRepository.count({
        where: { created_at: Between(start, end) },
      });

      const totalRevenue = await this.bookingsRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.total_amount)', 'total')
        .where('booking.created_at BETWEEN :start AND :end', { start, end })
        .andWhere('booking.booking_status != :cancelled', { cancelled: BookingStatus.CANCELLED })
        .getRawOne();

      return {
        period: { start, end },
        total_bookings: totalBookings,
        total_revenue: parseFloat(totalRevenue.total || 0),
        by_status: stats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: parseInt(stat.count),
            revenue: parseFloat(stat.revenue || 0),
          };
          return acc;
        }, {}),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get booking statistics');
    }
  }

  async getUpcomingBookingReminders(days: number = 1): Promise<any[]> {
    try {
      const startDate = new Date();
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const upcomingBookings = await this.bookingsRepository.find({
        where: {
          booking_date: Between(startDate, endDate),
          booking_status: BookingStatus.CONFIRMED,
        },
        relations: ['user', 'vehicle', 'location'],
      });

      return upcomingBookings.map(booking => ({
        booking_id: booking.id,
        user: booking.user ? booking.user.full_name : 'Unknown',
        vehicle: booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : 'Unknown',
        pickup_date: booking.booking_date,
        location: booking.location ? booking.location.name : 'Unknown',
        user_email: booking.user ? booking.user.email : null,
        user_phone: booking.user ? booking.user.contact_phone : null,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Failed to get upcoming reminders');
    }
  }

  async getRevenueStats(startDate?: string, endDate?: string, groupBy: string = 'month'): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year
      const end = endDate ? new Date(endDate) : new Date();

      let dateFormat: string;
      switch (groupBy) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'YYYY-WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        case 'year':
          dateFormat = 'YYYY';
          break;
        default:
          dateFormat = 'YYYY-MM';
      }

      const revenueStats = await this.bookingsRepository
        .createQueryBuilder('booking')
        .select(`TO_CHAR(booking.created_at, '${dateFormat}')`, 'period')
        .addSelect('COUNT(booking.booking_id)', 'bookings_count')
        .addSelect('SUM(booking.total_amount)', 'total_revenue')
        .where('booking.created_at BETWEEN :start AND :end', { start, end })
        .andWhere('booking.booking_status != :cancelled', { cancelled: BookingStatus.CANCELLED })
        .groupBy('period')
        .orderBy('period', 'ASC')
        .getRawMany();

      return revenueStats.map(stat => ({
        period: stat.period,
        bookings_count: parseInt(stat.bookings_count),
        total_revenue: parseFloat(stat.total_revenue || 0),
      }));
    } catch (error) {
      throw new InternalServerErrorException('Failed to get revenue statistics');
    }
  }

  async bulkConfirmBookings(bookingIds: string[]): Promise<{
    success: string[];
    failed: { id: string; reason: string }[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const bookingId of bookingIds) {
      try {
        await this.confirmBooking(bookingId);
        results.success.push(bookingId);
      } catch (error) {
        results.failed.push({ id: bookingId, reason: error.message });
      }
    }

    return results;
  }

  async bulkCancelBookings(bookingIds: string[], reason: string): Promise<{
    success: string[];
    failed: { id: string; reason: string }[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const bookingId of bookingIds) {
      try {
        await this.cancelBooking(bookingId, reason);
        results.success.push(bookingId);
      } catch (error) {
        results.failed.push({ id: bookingId, reason: error.message });
      }
    }

    return results;
  }

  async checkForOverdueBookings(): Promise<void> {
    try {
      const overdueBookings = await this.bookingsRepository.find({
        where: {
          return_date: LessThanOrEqual(new Date()),
          booking_status: BookingStatus.ACTIVE,
        },
        relations: ['user'],
      });

      for (const booking of overdueBookings) {
        // Mark as completed and charge late fees
        booking.booking_status = BookingStatus.COMPLETED;
        await this.bookingsRepository.save(booking);

        // Send overdue notification
        if (booking.user) {
          // TODO: Implement sendOverdueNotification method in MailService
          // await this.emailService.sendOverdueNotification(booking.user.email, booking);
        }
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to check for overdue bookings');
    }
  }
}