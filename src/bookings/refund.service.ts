import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CancellationPolicy } from './entities/cancellation-policy.entity';
import { Refund, RefundStatus } from './entities/refund.entity';
import { Booking } from './entities/booking.entity';
import {
  CreateRefundDto,
  ProcessRefundDto,
} from './dto/create-refund.dto';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(CancellationPolicy)
    private policyRepository: Repository<CancellationPolicy>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Calculate refund amount based on cancellation policy
   */
  async calculateRefund(
    bookingId: number,
  ): Promise<{
    refundAmount: number;
    cancellationFee: number;
    refundPercentage: number;
    policyApplied: CancellationPolicy;
  }> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const now = new Date();
    const bookingStart = new Date(booking.startDate);
    const hoursUntilBooking =
      (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Find applicable policy
    const policies = await this.policyRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC' },
    });

    let applicablePolicy = policies.find(
      (p) => hoursUntilBooking >= p.hoursBeforeStart,
    );

    // If no policy found, use strictest (0% refund)
    if (!applicablePolicy) {
      applicablePolicy = policies[policies.length - 1] || {
        refundPercentage: 0,
        cancellationFee: booking.totalPrice * 0.2, // 20% default fee
      } as CancellationPolicy;
    }

    const refundPercentage = applicablePolicy.refundPercentage;
    const cancellationFee = applicablePolicy.cancellationFee || 0;

    const refundAmount =
      (booking.totalPrice * refundPercentage) / 100 - cancellationFee;

    return {
      refundAmount: Math.max(0, refundAmount),
      cancellationFee,
      refundPercentage,
      policyApplied: applicablePolicy,
    };
  }

  /**
   * Create a refund record
   */
  async createRefund(
    createRefundDto: CreateRefundDto,
    userId: number,
  ): Promise<Refund> {
    const booking = await this.bookingRepository.findOne({
      where: { id: createRefundDto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const refundCalc = await this.calculateRefund(createRefundDto.bookingId);

    const refund = this.refundRepository.create({
      bookingId: createRefundDto.bookingId,
      userId,
      originalAmount: booking.totalPrice,
      refundAmount: refundCalc.refundAmount,
      cancellationFee: refundCalc.cancellationFee,
      refundPercentage: refundCalc.refundPercentage,
      reason: createRefundDto.reason,
      notes: createRefundDto.notes,
      status: RefundStatus.PENDING,
    });

    const savedRefund = await this.refundRepository.save(refund);

    this.logger.log(
      `Refund created - ID: ${savedRefund.id}, Amount: ${refundCalc.refundAmount}, Booking: ${createRefundDto.bookingId}`,
    );

    return savedRefund;
  }

  /**
   * Process refund via payment gateway (Stripe/Paystack)
   */
  async processRefund(
    processRefundDto: ProcessRefundDto,
    processedBy: number,
  ): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id: processRefundDto.refundId },
      relations: ['booking'],
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    try {
      // TODO: Integrate with Stripe/Paystack
      // const stripeRefund = await this.stripeService.createRefund({
      //   payment_intent: refund.paymentIntentId,
      //   amount: refund.refundAmount * 100,
      // });

      refund.status = RefundStatus.COMPLETED;
      refund.processedBy = processedBy;
      refund.processedAt = new Date();
      // refund.stripeRefundId = stripeRefund.id;

      if (processRefundDto.notes) {
        refund.notes = processRefundDto.notes;
      }

      await this.refundRepository.save(refund);

      this.logger.log(`Refund processed successfully - ID: ${refund.id}`);

      return refund;
    } catch (error) {
      refund.status = RefundStatus.FAILED;
      refund.errorMessage = error.message;
      await this.refundRepository.save(refund);

      this.logger.error(`Refund processing failed - ID: ${refund.id}`, error);
      throw error;
    }
  }

  /**
   * Get all refunds
   */
  async findAll(): Promise<Refund[]> {
    return this.refundRepository.find({
      relations: ['booking', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get refund by ID
   */
  async findOne(id: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id },
      relations: ['booking', 'user'],
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return refund;
  }

  /**
   * Get refunds for a booking
   */
  async findByBooking(bookingId: number): Promise<Refund[]> {
    return this.refundRepository.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get refunds for a user
   */
  async findByUser(userId: number): Promise<Refund[]> {
    return this.refundRepository.find({
      where: { userId },
      relations: ['booking'],
      order: { createdAt: 'DESC' },
    });
  }
}
