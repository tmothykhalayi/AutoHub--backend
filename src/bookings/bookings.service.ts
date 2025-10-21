import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In, Not } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,

    private readonly mailService: MailService
  ) {}

  async create(createBookingDto: CreateBookingDto & { userId: number }): Promise<Booking> {
    const { userId, vehicleId, startDate, endDate, status, pickupLocation, dropoffLocation } = createBookingDto;

    // 1. User Validation
    const user = await this.userRepository.findOne({ 
      where: { id: userId }
    });
    if (!user) throw new NotFoundException('User not found');

    // 2. Vehicle Validation
    const vehicle = await this.vehicleRepository.findOne({ 
      where: { id: vehicleId },
      relations: ['spec', 'branch']
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // 3. Vehicle Availability Check
    if (!vehicle.isAvailable) {
      throw new BadRequestException('Vehicle is not available for booking');
    }

    // 4. Validate Vehicle Status
    if (vehicle.status !== 'available') {
      throw new BadRequestException(`Vehicle is currently ${vehicle.status}`);
    }

    // 5. Date Validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    // 6. Maximum Rental Duration (e.g., 30 days)
    const maxRentalDays = 30;
    const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (rentalDays > maxRentalDays) {
      throw new BadRequestException(`Maximum rental duration is ${maxRentalDays} days`);
    }

    // 7. Minimum Rental Duration (e.g., 1 day)
    const minRentalDays = 1;
    if (rentalDays < minRentalDays) {
      throw new BadRequestException(`Minimum rental duration is ${minRentalDays} day`);
    }

    // 8. Check for Date Conflicts
    const existingBooking = await this.bookingRepository.findOne({
      where: [
        {
          vehicle: { id: vehicleId },
          status: In(['confirmed', 'active', 'pending']),
          startDate: Between(start, end),
        },
        {
          vehicle: { id: vehicleId },
          status: In(['confirmed', 'active', 'pending']),
          endDate: Between(start, end),
        },
        {
          vehicle: { id: vehicleId },
          status: In(['confirmed', 'active', 'pending']),
          startDate: LessThanOrEqual(start),
          endDate: MoreThanOrEqual(end),
        },
      ],
    });

    if (existingBooking) {
      throw new ConflictException('Vehicle is already booked for the selected dates');
    }

    // 9. Calculate Actual Price
    const actualPricePerDay = vehicle.spec?.dailyRate || 50;
    const totalPrice = actualPricePerDay * rentalDays;
    // Use default security deposit since property doesn't exist in VehicleSpec
    const securityDeposit = 100;

    // 10. Create Booking
    const booking = this.bookingRepository.create({
      user,
      vehicle,
      startDate: start,
      endDate: end,
      status: status ?? 'confirmed',
      totalPrice,
      securityDeposit,
      pickupLocation: pickupLocation || vehicle.branch?.name,
      dropoffLocation: dropoffLocation || vehicle.branch?.name,
      rentalDays,
    });

    // 11. Update Vehicle Availability
    vehicle.isAvailable = false;
    vehicle.status = 'reserved';
    await this.vehicleRepository.save(vehicle);

    const savedBooking = await this.bookingRepository.save(booking);

    // 12. Enhanced Email with Actual Pricing
    try {
      await this.mailService.sendBookingConfirmation(user.email, {
        name: user.firstName || 'Valued Customer',
        bookingId: savedBooking.id.toString(),
        vehicleName: vehicle.spec ? `${vehicle.spec.make} ${vehicle.spec.model} (${vehicle.spec.year})` : 'Your vehicle',
        startDate: start,
        endDate: end,
        totalPrice: totalPrice,
        pickupLocation: pickupLocation || vehicle.branch?.name || 'Main Branch',
        dropoffLocation: dropoffLocation || vehicle.branch?.name || 'Main Branch',
        securityDeposit,
        rentalDays
      } as any);
      this.logger.log(`Booking confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email: ${error.message}`);
    }

    // 13. Audit Logging
    this.logger.log(`Booking created - ID: ${savedBooking.id}, User: ${user.id}, Vehicle: ${vehicle.id}, Total: $${totalPrice}`);

    return savedBooking;
  }

  async findAll(options?: {
    userId?: number;
    vehicleId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Booking[]> {
    const whereConditions: any = {};

    if (options?.userId) {
      whereConditions.user = { id: options.userId };
    }

    if (options?.vehicleId) {
      whereConditions.vehicle = { id: options.vehicleId };
    }

    if (options?.status) {
      whereConditions.status = options.status;
    }

    if (options?.startDate && options?.endDate) {
      whereConditions.startDate = Between(options.startDate, options.endDate);
    }

    const bookings = await this.bookingRepository.find({
      where: whereConditions,
      relations: ['user', 'vehicle', 'vehicle.spec', 'vehicle.branch', 'payment'],
      order: { createdAt: 'DESC' },
    });

    // Add calculated fields to each booking
    return bookings.map(booking => {
      const today = new Date();
      const isActive = today >= booking.startDate && today <= booking.endDate;
      const isUpcoming = today < booking.startDate;
      const isCompleted = today > booking.endDate;
      const isCancellable = isUpcoming && booking.status === 'confirmed';

      return {
        ...booking,
        isActive,
        isUpcoming,
        isCompleted,
        isCancellable,
        daysRemaining: isUpcoming ? Math.ceil((booking.startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      };
    });
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'vehicle', 'vehicle.spec', 'vehicle.branch', 'payment'],
    });
    
    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }

    // Add calculated fields
    const today = new Date();
    const isActive = today >= booking.startDate && today <= booking.endDate;
    const isUpcoming = today < booking.startDate;
    const isCompleted = today > booking.endDate;
    const isCancellable = isUpcoming && booking.status === 'confirmed';

    return {
      ...booking,
      isActive,
      isUpcoming,
      isCompleted,
      isCancellable,
      daysRemaining: isUpcoming ? Math.ceil((booking.startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    };
  }

  async update(id: number, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.findOne(id);
    const changes: string[] = [];

    // 14. Prevent updates on completed or cancelled bookings
    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new BadRequestException(`Cannot update ${booking.status} booking`);
    }

    // 15. User Update
    if (updateBookingDto.userId && updateBookingDto.userId !== booking.user.id) {
      const user = await this.userRepository.findOne({ 
        where: { id: updateBookingDto.userId }
      });
      if (!user) throw new NotFoundException('User not found');
      
      booking.user = user;
      changes.push('User changed');
    }

    // 16. Vehicle Update with Conflict Check
    if (updateBookingDto.vehicleId && updateBookingDto.vehicleId !== booking.vehicle.id) {
      const newVehicle = await this.vehicleRepository.findOne({ 
        where: { id: updateBookingDto.vehicleId },
        relations: ['spec']
      });
      if (!newVehicle) throw new NotFoundException('Vehicle not found');

      if (!newVehicle.isAvailable) {
        throw new BadRequestException('New vehicle is not available');
      }

      // Check date conflicts for new vehicle
      const conflict = await this.bookingRepository.findOne({
        where: [
          {
            vehicle: { id: newVehicle.id },
            status: In(['confirmed', 'active']),
            startDate: Between(booking.startDate, booking.endDate),
          },
          {
            vehicle: { id: newVehicle.id },
            status: In(['confirmed', 'active']),
            endDate: Between(booking.startDate, booking.endDate),
          },
        ],
      });

      if (conflict) {
        throw new ConflictException('New vehicle is already booked for these dates');
      }

      // Free up old vehicle
      const oldVehicle = booking.vehicle;
      oldVehicle.isAvailable = true;
      oldVehicle.status = 'available';
      await this.vehicleRepository.save(oldVehicle);

      // Reserve new vehicle
      newVehicle.isAvailable = false;
      newVehicle.status = 'reserved';
      await this.vehicleRepository.save(newVehicle);

      booking.vehicle = newVehicle;
      changes.push('Vehicle changed');
    }

    // 17. Date Change Validation
    let datesChanged = false;
    if (updateBookingDto.startDate || updateBookingDto.endDate) {
      const newStartDate = updateBookingDto.startDate ? new Date(updateBookingDto.startDate) : booking.startDate;
      const newEndDate = updateBookingDto.endDate ? new Date(updateBookingDto.endDate) : booking.endDate;

      if (newStartDate < new Date()) {
        throw new BadRequestException('New start date cannot be in the past');
      }

      if (newEndDate <= newStartDate) {
        throw new BadRequestException('New end date must be after start date');
      }

      // Check for date conflicts with new dates
      const conflict = await this.bookingRepository.findOne({
        where: [
          {
            vehicle: { id: booking.vehicle.id },
            status: In(['confirmed', 'active']),
            id: Not(booking.id),
            startDate: Between(newStartDate, newEndDate),
          },
          {
            vehicle: { id: booking.vehicle.id },
            status: In(['confirmed', 'active']),
            id: Not(booking.id),
            endDate: Between(newStartDate, newEndDate),
          },
        ],
      });

      if (conflict) {
        throw new ConflictException('Vehicle is already booked for the new dates');
      }

      if (updateBookingDto.startDate) {
        booking.startDate = newStartDate;
        changes.push('Start date changed');
        datesChanged = true;
      }

      if (updateBookingDto.endDate) {
        booking.endDate = newEndDate;
        changes.push('End date changed');
        datesChanged = true;
      }

      // Recalculate price if dates changed
      if (datesChanged) {
        const rentalDays = Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24));
        booking.rentalDays = rentalDays;
        booking.totalPrice = (booking.vehicle.spec?.dailyRate || 50) * rentalDays;
        changes.push('Price updated');
      }
    }

    if (updateBookingDto.status) {
      // 18. Status Transition Validation
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['active', 'cancelled'],
        'active': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
      };

      if (!validTransitions[booking.status]?.includes(updateBookingDto.status)) {
        throw new BadRequestException(`Invalid status transition from ${booking.status} to ${updateBookingDto.status}`);
      }

      booking.status = updateBookingDto.status;
      changes.push(`Status changed to ${updateBookingDto.status}`);

      // Handle vehicle status based on booking status
      if (updateBookingDto.status === 'cancelled') {
        booking.vehicle.isAvailable = true;
        booking.vehicle.status = 'available';
        await this.vehicleRepository.save(booking.vehicle);
      } else if (updateBookingDto.status === 'completed') {
        booking.vehicle.isAvailable = true;
        booking.vehicle.status = 'available';
        await this.vehicleRepository.save(booking.vehicle);
      }
    }

    const updatedBooking = await this.bookingRepository.save(booking);

    // 19. Enhanced Update Notification
    if (changes.length > 0) {
      try {
        await this.mailService.sendBookingUpdate(booking.user.email, {
          name: booking.user.firstName || 'Valued Customer',
          bookingId: booking.id.toString(),
          vehicleName: booking.vehicle.spec ? 
            `${booking.vehicle.spec.make} ${booking.vehicle.spec.model} (${booking.vehicle.spec.year})` : 
            'Your vehicle',
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          pickupLocation: booking.pickupLocation,
          changes: changes
        });
        this.logger.log(`Booking update email sent to ${booking.user.email}`);
      } catch (error) {
        this.logger.error(`Failed to send booking update email: ${error.message}`);
      }
    }

    this.logger.log(`Booking updated - ID: ${id}, Changes: ${changes.join(', ')}`);

    return updatedBooking;
  }

  async remove(id: number): Promise<{ message: string }> {
    const booking = await this.findOne(id);

    // 20. Prevent deletion of active bookings
    if (booking.status === 'active') {
      throw new BadRequestException('Cannot delete active booking. Please cancel it first.');
    }

    const user = booking.user;
    const vehicle = booking.vehicle;

    // Store booking details for email before removal
    const bookingDetails = {
      name: user.firstName || 'Valued Customer',
      bookingId: booking.id.toString(),
      vehicleName: vehicle.spec ? 
        `${vehicle.spec.make} ${vehicle.spec.model} (${vehicle.spec.year})` : 
        'Your vehicle',
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      cancellationReason: 'Booking deleted by admin',
    };

    // Set vehicle back to available
    if (vehicle && booking.status !== 'cancelled' && booking.status !== 'completed') {
      vehicle.isAvailable = true;
      vehicle.status = 'available';
      await this.vehicleRepository.save(vehicle);
    }

    await this.bookingRepository.remove(booking);

    // Send booking cancellation email
    try {
      await this.mailService.sendBookingCancellation(user.email, bookingDetails);
      this.logger.log(`Booking cancellation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking cancellation email: ${error.message}`);
    }

    this.logger.log(`Booking deleted - ID: ${id}, User: ${user.id}, Vehicle: ${vehicle.id}`);

    return { message: `Booking #${id} has been successfully deleted` };
  }

  // 21. Additional Business Methods
  async getUserBookings(userId: number): Promise<Booking[]> {
    const bookings = await this.bookingRepository.find({
      where: { user: { id: userId } },
      relations: ['vehicle', 'vehicle.spec', 'payment'],
      order: { createdAt: 'DESC' },
    });

    // Add calculated fields
    const today = new Date();
    return bookings.map(booking => ({
      ...booking,
      isActive: today >= booking.startDate && today <= booking.endDate,
      isUpcoming: today < booking.startDate,
      isCompleted: today > booking.endDate,
      isCancellable: today < booking.startDate && booking.status === 'confirmed',
    }));
  }
  
  // Fixed method to get a specific booking for a user, ensuring they can only access their own bookings
  async getUserBookingById(bookingId: number, userId: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { 
        id: bookingId,
        user: { id: userId } 
      },
      relations: ['user', 'vehicle', 'vehicle.spec', 'vehicle.branch', 'payment'],
    });
    
    if (!booking) {
      throw new NotFoundException('Booking not found or access denied');
    }

    // Add calculated fields
    const today = new Date();
    const isActive = today >= booking.startDate && today <= booking.endDate;
    const isUpcoming = today < booking.startDate;
    const isCompleted = today > booking.endDate;
    const isCancellable = isUpcoming && booking.status === 'confirmed';

    return {
      ...booking,
      isActive,
      isUpcoming,
      isCompleted,
      isCancellable,
      daysRemaining: isUpcoming ? Math.ceil((booking.startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    };
  }

  async cancelUserBooking(bookingId: number, userId: number, reason?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { 
        id: bookingId,
        user: { id: userId } 
      },
      relations: ['user', 'vehicle', 'vehicle.spec'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or access denied');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Calculate cancellation fee based on how close to start date
    const daysUntilStart = Math.ceil((booking.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    let cancellationFee = 0;

    if (daysUntilStart < 1) {
      cancellationFee = booking.totalPrice * 0.5; // 50% fee if cancelled within 24 hours
    } else if (daysUntilStart < 3) {
      cancellationFee = booking.totalPrice * 0.25; // 25% fee if cancelled within 3 days
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'User cancelled';
    booking.cancellationFee = cancellationFee;

    // Free up vehicle
    booking.vehicle.isAvailable = true;
    booking.vehicle.status = 'available';
    await this.vehicleRepository.save(booking.vehicle);

    const cancelledBooking = await this.bookingRepository.save(booking);

    // Send cancellation email with fee information
    try {
      await this.mailService.sendBookingCancellation(booking.user.email, {
        name: booking.user.firstName || 'Valued Customer',
        bookingId: booking.id.toString(),
        vehicleName: booking.vehicle.spec ? 
          `${booking.vehicle.spec.make} ${booking.vehicle.spec.model} (${booking.vehicle.spec.year})` : 
          'Your vehicle',
        startDate: booking.startDate,
        endDate: booking.endDate,
        cancellationReason: reason || 'Booking cancelled',
        refundAmount: booking.totalPrice - cancellationFee,
      });
    } catch (error) {
      this.logger.error(`Failed to send cancellation email: ${error.message}`);
    }

    return cancelledBooking;
  }

  async getVehicleBookings(vehicleId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { vehicle: { id: vehicleId } },
      relations: ['user'],
      order: { startDate: 'ASC' },
    });
  }

  async getActiveBookings(): Promise<Booking[]> {
    const today = new Date();
    return this.bookingRepository.find({
      where: {
        status: In(['confirmed', 'active']),
        startDate: LessThanOrEqual(today),
        endDate: MoreThanOrEqual(today),
      },
      relations: ['user', 'vehicle', 'vehicle.spec'],
    });
  }

  async getUpcomingBookings(): Promise<Booking[]> {
    const today = new Date();
    return this.bookingRepository.find({
      where: {
        status: 'confirmed',
        startDate: MoreThanOrEqual(today),
      },
      relations: ['user', 'vehicle', 'vehicle.spec'],
      order: { startDate: 'ASC' },
    });
  }

  async cancelBooking(id: number, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Calculate cancellation fee based on how close to start date
    const daysUntilStart = Math.ceil((booking.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    let cancellationFee = 0;

    if (daysUntilStart < 1) {
      cancellationFee = booking.totalPrice * 0.5; // 50% fee if cancelled within 24 hours
    } else if (daysUntilStart < 3) {
      cancellationFee = booking.totalPrice * 0.25; // 25% fee if cancelled within 3 days
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'User cancelled';
    booking.cancellationFee = cancellationFee;

    // Free up vehicle
    booking.vehicle.isAvailable = true;
    booking.vehicle.status = 'available';
    await this.vehicleRepository.save(booking.vehicle);

    const cancelledBooking = await this.bookingRepository.save(booking);

    // Send cancellation email with fee information
    try {
      await this.mailService.sendBookingCancellation(booking.user.email, {
        name: booking.user.firstName || 'Valued Customer',
        bookingId: booking.id.toString(),
        vehicleName: booking.vehicle.spec ? 
          `${booking.vehicle.spec.make} ${booking.vehicle.spec.model} (${booking.vehicle.spec.year})` : 
          'Your vehicle',
        startDate: booking.startDate,
        endDate: booking.endDate,
        refundAmount: booking.totalPrice - cancellationFee,
        cancellationReason: reason || 'Booking cancelled',
      });
    } catch (error) {
      this.logger.error(`Failed to send cancellation email: ${error.message}`);
    }

    return cancelledBooking;
  }

  async getBookingStats(): Promise<any> {
    const totalBookings = await this.bookingRepository.count();
    const activeBookings = await this.bookingRepository.count({ where: { status: 'active' } });
    const upcomingBookings = await this.bookingRepository.count({ where: { status: 'confirmed' } });
    const completedBookings = await this.bookingRepository.count({ where: { status: 'completed' } });
    const cancelledBookings = await this.bookingRepository.count({ where: { status: 'cancelled' } });
    
    const revenueResult = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalPrice)', 'totalRevenue')
      .where('booking.status = :status', { status: 'completed' })
      .getRawOne();

    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenueResult = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalPrice)', 'monthlyRevenue')
      .where('booking.status = :status AND booking.createdAt >= :monthStart', {
        status: 'completed',
        monthStart: currentMonthStart
      })
      .getRawOne();

    return {
      totalBookings,
      activeBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: parseFloat(revenueResult?.totalRevenue || 0),
      monthlyRevenue: parseFloat(monthlyRevenueResult?.monthlyRevenue || 0),
      cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
    };
  }

  async checkVehicleAvailability(vehicleId: number, startDate: Date, endDate: Date): Promise<boolean> {
    const conflict = await this.bookingRepository.findOne({
      where: [
        {
          vehicle: { id: vehicleId },
          status: In(['confirmed', 'active']),
          startDate: Between(startDate, endDate),
        },
        {
          vehicle: { id: vehicleId },
          status: In(['confirmed', 'active']),
          endDate: Between(startDate, endDate),
        },
        {
          vehicle: { id: vehicleId },
          status: In(['confirmed', 'active']),
          startDate: LessThanOrEqual(startDate),
          endDate: MoreThanOrEqual(endDate),
        },
      ],
    });

    return !conflict;
  }
}