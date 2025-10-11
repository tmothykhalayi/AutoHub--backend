
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { userId, vehicleId, startDate, endDate, status } = createBookingDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // Basic availability check example
    if (vehicle.status !== 'available') {
      throw new BadRequestException('Vehicle not available');
    }

    const booking = this.bookingRepository.create({
      user,
      vehicle,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status ?? 'confirmed',
    });

    // Optionally update vehicle status
    vehicle.status = 'rented';
    await this.vehicleRepository.save(vehicle);

    return this.bookingRepository.save(booking);
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

    if (updateBookingDto.userId) {
      const user = await this.userRepository.findOne({ where: { id: updateBookingDto.userId } });
      if (!user) throw new NotFoundException('User not found');
      booking.user = user;
    }

    if (updateBookingDto.vehicleId) {
      const vehicle = await this.vehicleRepository.findOne({ where: { id: updateBookingDto.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      booking.vehicle = vehicle;
    }

    if (updateBookingDto.startDate) booking.startDate = new Date(updateBookingDto.startDate);
    if (updateBookingDto.endDate) booking.endDate = new Date(updateBookingDto.endDate);
    if (updateBookingDto.status) booking.status = updateBookingDto.status;

    return this.bookingRepository.save(booking);
  }

  async remove(id: number): Promise<void> {
    const booking = await this.findOne(id);

    // Optionally set vehicle back to 'available'
    const vehicle = booking.vehicle;
    if (vehicle) {
      vehicle.status = 'available';
      await this.vehicleRepository.save(vehicle);
    }

    await this.bookingRepository.remove(booking);
  }
}
