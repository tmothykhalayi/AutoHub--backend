import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking } from './entities/booking.entity';
import {
  LateReturnPenalty,
  PenaltyStatus,
} from './entities/late-return-penalty.entity';
import { VehicleSpec } from './../vehicle-spec/entities/vehicle-spec.entity';

@Injectable()
export class LateReturnService {
  private readonly logger = new Logger(LateReturnService.name);
  private readonly GRACE_PERIOD_HOURS = 2; // 2 hour grace period
  private readonly PENALTY_MULTIPLIER = 1.5; // 1.5x normal rate for overtime

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(LateReturnPenalty)
    private penaltyRepository: Repository<LateReturnPenalty>,
    @InjectRepository(VehicleSpec)
    private vehicleSpecRepository: Repository<VehicleSpec>,
  ) {}

  /**
   * Cron job runs every hour to check for overdue bookings
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueBookings() {
    this.logger.log('Checking for overdue bookings...');

    const now = new Date();

    // Find bookings that are past end date and still active
    const overdueBookings = await this.bookingRepository.find({
      where: {
        endDate: LessThan(now),
        status: 'active',
      },
      relations: ['vehicle', 'vehicle.spec'],
    });

    this.logger.log(`Found ${overdueBookings.length} overdue bookings`);

    for (const booking of overdueBookings) {
      try {
        await this.processPenalty(booking);
      } catch (error) {
        this.logger.error(
          `Failed to process penalty for booking ${booking.id}`,
          error,
        );
      }
    }
  }

  /**
   * Calculate and create penalty for late return
   */
  async processPenalty(booking: Booking): Promise<LateReturnPenalty> {
    // Check if penalty already exists
    const existingPenalty = await this.penaltyRepository.findOne({
      where: { bookingId: booking.id },
    });

    if (existingPenalty) {
      this.logger.log(`Penalty already exists for booking ${booking.id}`);
      return existingPenalty;
    }

    const now = new Date();
    const expectedReturn = new Date(booking.endDate);
    const lateMilliseconds = now.getTime() - expectedReturn.getTime();
    const lateHours = Math.floor(lateMilliseconds / (1000 * 60 * 60));
    const lateDays = Math.floor(lateHours / 24);

    // Calculate billable hours after grace period
    const billableHours = Math.max(0, lateHours - this.GRACE_PERIOD_HOURS);

    // Get vehicle rates
    const spec = booking.vehicle?.spec;
    if (!spec) {
      throw new Error('Vehicle spec not found');
    }

    const dailyRate = Number(spec.dailyRate);
    const hourlyRate = dailyRate / 24;

    // Calculate penalty with multiplier
    const penaltyAmount =
      billableHours * hourlyRate * this.PENALTY_MULTIPLIER;

    const penalty = this.penaltyRepository.create({
      bookingId: booking.id,
      expectedReturnDate: expectedReturn,
      actualReturnDate: now,
      lateHours,
      lateDays,
      gracePeriodUsed: Math.min(lateHours, this.GRACE_PERIOD_HOURS),
      billableHours,
      hourlyRate,
      dailyRate,
      penaltyAmount,
      additionalFees: 0,
      totalAmount: penaltyAmount,
      status: PenaltyStatus.CALCULATED,
    });

    const savedPenalty = await this.penaltyRepository.save(penalty);

    this.logger.log(
      `Penalty calculated - Booking: ${booking.id}, Amount: ${penaltyAmount}, Late hours: ${lateHours}`,
    );

    // TODO: Charge customer via payment gateway
    // await this.chargeCustomer(savedPenalty);

    return savedPenalty;
  }

  /**
   * Charge customer for late return penalty
   */
  async chargeCustomer(penalty: LateReturnPenalty): Promise<void> {
    try {
      // TODO: Integrate with Stripe/Paystack
      // const charge = await this.stripeService.createCharge({
      //   amount: penalty.totalAmount * 100,
      //   currency: 'usd',
      //   customer: booking.user.stripeCustomerId,
      //   description: `Late return penalty for booking ${penalty.bookingId}`,
      // });

      penalty.status = PenaltyStatus.CHARGED;
      // penalty.stripeChargeId = charge.id;
      penalty.chargedAt = new Date();

      await this.penaltyRepository.save(penalty);

      this.logger.log(`Penalty charged successfully - ID: ${penalty.id}`);
    } catch (error) {
      this.logger.error(`Failed to charge penalty ${penalty.id}`, error);
      throw error;
    }
  }

  /**
   * Waive a penalty
   */
  async waivePenalty(
    penaltyId: number,
    waivedBy: number,
    reason: string,
  ): Promise<LateReturnPenalty> {
    const penalty = await this.penaltyRepository.findOne({
      where: { id: penaltyId },
    });

    if (!penalty) {
      throw new Error('Penalty not found');
    }

    penalty.status = PenaltyStatus.WAIVED;
    penalty.waivedBy = waivedBy;
    penalty.waivedAt = new Date();
    penalty.waivedReason = reason;

    await this.penaltyRepository.save(penalty);

    this.logger.log(`Penalty waived - ID: ${penaltyId}, Reason: ${reason}`);

    return penalty;
  }

  /**
   * Get all penalties
   */
  async findAll(): Promise<LateReturnPenalty[]> {
    return this.penaltyRepository.find({
      relations: ['booking'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get penalty by booking ID
   */
  async findByBooking(bookingId: number): Promise<LateReturnPenalty | null> {
    return this.penaltyRepository.findOne({
      where: { bookingId },
    });
  }

  /**
   * Get unpaid penalties
   */
  async findUnpaid(): Promise<LateReturnPenalty[]> {
    return this.penaltyRepository.find({
      where: [
        { status: PenaltyStatus.CALCULATED },
        { status: PenaltyStatus.CHARGED },
      ],
      relations: ['booking'],
    });
  }
}
