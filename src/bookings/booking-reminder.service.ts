import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { MailService } from '../mail/mail.service';
import * as moment from 'moment';

@Injectable()
export class BookingReminderService {
  private readonly logger = new Logger(BookingReminderService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly mailService: MailService,
  ) {}

  // Run every day at 10:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendReturnReminders() {
    this.logger.log('Running return reminder check...');
    
    const tomorrow = moment().add(1, 'days').startOf('day');
    const dayAfterTomorrow = moment(tomorrow).add(1, 'days').endOf('day');
    
    // Find bookings that end tomorrow
    const bookingsEndingTomorrow = await this.bookingRepository.find({
      where: {
        endDate: Between(tomorrow.toDate(), dayAfterTomorrow.toDate()),
        status: 'confirmed'
      },
      relations: ['user', 'vehicle', 'vehicle.branch', 'vehicle.spec']
    });
    
    this.logger.log(`Found ${bookingsEndingTomorrow.length} bookings ending tomorrow`);
    
    // Send email reminders
    for (const booking of bookingsEndingTomorrow) {
      try {
        const fullName = `${booking.user.firstName} ${booking.user.lastName}`;
        await this.mailService.sendReturnReminder(booking.user.email, {
          name: fullName || 'Valued Customer',
          bookingId: booking.id.toString(),
          vehicleName: booking.vehicle?.spec ? 
            `${booking.vehicle.spec.make} ${booking.vehicle.spec.model} (${booking.vehicle.spec.year})` : 
            'Your vehicle',
          returnDate: booking.endDate,
          returnLocation: booking.vehicle?.branch?.name || 'Main Branch',
          contactNumber: '123-456-7890' // This should come from actual branch data
        });
        this.logger.log(`Vehicle return reminder sent to ${booking.user.email}`);
      } catch (error) {
        this.logger.error(`Failed to send vehicle return reminder: ${error.message}`);
      }
    }
  }
}