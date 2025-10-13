import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { userId, vehicleId, startDate, endDate, status } = createBookingDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // Use boolean isAvailable here:
    if (!vehicle.isAvailable) {
      throw new BadRequestException('Vehicle not available');
    }

    const booking = this.bookingRepository.create({
      user,
      vehicle,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status ?? 'confirmed',
    });

    // Update vehicle availability
    vehicle.isAvailable = false;
    await this.vehicleRepository.save(vehicle);

    const savedBooking = await this.bookingRepository.save(booking);
    
    // Calculate number of days
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    // Default price until we have actual price data
    const pricePerDay = 50; // Default value
    const totalPrice = pricePerDay * days;

    // Load vehicle spec for email
    await vehicle.spec;
    
    // Send booking confirmation email
    try {
      await this.mailService.sendBookingConfirmation(user.email, {
        name: user.firstName || user.full_name || 'Valued Customer',
        bookingId: savedBooking.id.toString(),
        vehicleName: vehicle.spec ? `${vehicle.spec.make} ${vehicle.spec.model} (${vehicle.spec.year})` : 'Your vehicle',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: totalPrice,
        pickupLocation: vehicle.branch?.name || 'Main Branch'
      });
      this.logger.log(`Booking confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email: ${error.message}`);
      // Don't throw error here to prevent booking creation failure
    }

    return savedBooking;
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: ['user', 'vehicle', 'payment'],
    });
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'vehicle', 'payment'],
    });
    if (!booking) throw new NotFoundException(`Booking with id ${id} not found`);
    return booking;
  }

  async update(id: number, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.findOne(id);
    const changes: string[] = [];
    const originalStartDate = new Date(booking.startDate);
    const originalEndDate = new Date(booking.endDate);
    
    if (updateBookingDto.userId) {
      const user = await this.userRepository.findOne({ where: { id: updateBookingDto.userId } });
      if (!user) throw new NotFoundException('User not found');
      booking.user = user;
    }

    if (updateBookingDto.vehicleId) {
      const vehicle = await this.vehicleRepository.findOne({ where: { id: updateBookingDto.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      booking.vehicle = vehicle;
      changes.push('Vehicle changed');
    }

    if (updateBookingDto.startDate) {
      booking.startDate = new Date(updateBookingDto.startDate);
      changes.push('Start date changed');
    }
    
    if (updateBookingDto.endDate) {
      booking.endDate = new Date(updateBookingDto.endDate);
      changes.push('End date changed');
    }
    
    if (updateBookingDto.status) {
      booking.status = updateBookingDto.status;
      changes.push(`Status changed to ${updateBookingDto.status}`);
    }

    const updatedBooking = await this.bookingRepository.save(booking);
    
    // Send booking update email if there are changes
    if (changes.length > 0) {
      try {
        // Calculate total price based on duration
        const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
        const pricePerDay = 50; // Default value
        const totalPrice = pricePerDay * days;
        
        // Load vehicle spec for email
        await booking.vehicle?.spec;
        
        await this.mailService.sendBookingUpdate(booking.user.email, {
          name: booking.user.firstName || booking.user.full_name || 'Valued Customer',
          bookingId: booking.id.toString(),
          vehicleName: booking.vehicle?.spec ? 
            `${booking.vehicle.spec.make} ${booking.vehicle.spec.model} (${booking.vehicle.spec.year})` : 
            'Your vehicle',
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: totalPrice,
          pickupLocation: booking.vehicle?.branch?.name || 'Main Branch',
          changes: changes
        });
        
        this.logger.log(`Booking update email sent to ${booking.user.email}`);
      } catch (error) {
        this.logger.error(`Failed to send booking update email: ${error.message}`);
      }
    }

    return updatedBooking;
  }

  async remove(id: number): Promise<void> {
    const booking = await this.findOne(id);
    const user = booking.user;
    const vehicle = booking.vehicle;
    
    // Store booking details for email before removal
    const bookingDetails = {
      name: user.firstName || user.full_name || 'Valued Customer',
      bookingId: booking.id.toString(),
      vehicleName: vehicle?.spec ? 
        `${vehicle.spec.make} ${vehicle.spec.model} (${vehicle.spec.year})` : 
        'Your vehicle',
      startDate: booking.startDate,
      endDate: booking.endDate,
      cancellationReason: 'Booking cancelled',
    };

    // Set vehicle back to available
    if (vehicle) {
      vehicle.isAvailable = true;
      await this.vehicleRepository.save(vehicle);
    }

    await this.bookingRepository.remove(booking);
    
    // Send booking cancellation email after removal
    try {
      await this.mailService.sendBookingCancellation(user.email, bookingDetails);
      this.logger.log(`Booking cancellation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking cancellation email: ${error.message}`);
    }
  }
}
