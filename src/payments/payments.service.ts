import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import * as crypto from 'crypto';
import axios from 'axios';

// Move API key to environment variable
const paystack = require('paystack')(
  process.env.PAYSTACK_SECRET_KEY ||
    'sk_test_742aa04eba08efb440f9eac360395c2b488e3093',
);

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // @InjectRepository(Appointment)
    // private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {
    // Validate environment variables
    if (!process.env.PAYSTACK_SECRET_KEY) {
      this.logger.warn(
        'PAYSTACK_SECRET_KEY not found in environment variables, using test key',
      );
    }
    if (!process.env.FRONTEND_URL) {
      this.logger.warn('FRONTEND_URL not found in environment variables');
    }
  }

  async initializePayment(
    createPaymentDto: CreatePaymentDto,
    user: User,
  ): Promise<any> {
    try {
      this.logger.log(`Initializing payment for user ${user.id}`);
      this.logger.log(`Payment data:`, createPaymentDto);

      // Validate input
      if (!createPaymentDto.amount || createPaymentDto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      if (
        !process.env.PAYSTACK_SECRET_KEY &&
        !process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_')
      ) {
        throw new BadRequestException(
          'Invalid Paystack secret key configuration',
        );
      }

      // Generate unique reference
      const reference = `PAY_${Date.now()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      this.logger.log(`Generated reference: ${reference}`);

      // Prepare Paystack payload with KES currency
      const paystackPayload = {
        email: createPaymentDto.email,
        amount: Math.round(createPaymentDto.amount * 100), // Convert to cents (KES cents)
        reference: reference,
        currency: 'KES', // Changed from NGN to KES
        callback_url:
          createPaymentDto.returnUrl ||
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-verify`,
        metadata: {
          custom_fields: [
            {
              display_name: 'Full Name',
              variable_name: 'full_name',
              value: createPaymentDto.fullName,
            },
            {
              display_name: 'Phone Number',
              variable_name: 'phone_number',
              value: createPaymentDto.phoneNumber,
            },
            {
              display_name: 'Payment Type',
              variable_name: 'payment_type',
              value: createPaymentDto.type,
            },
          ],
        },
      };

      this.logger.log(
        `Paystack payload:`,
        JSON.stringify(paystackPayload, null, 2),
      );

      // Initialize payment with Paystack
      let paystackResponse;
      try {
        paystackResponse =
          await paystack.transaction.initialize(paystackPayload);
        this.logger.log(
          `Paystack response:`,
          JSON.stringify(paystackResponse, null, 2),
        );
      } catch (paystackError) {
        this.logger.error('Paystack API Error:', paystackError);
        this.logger.error('Paystack Error Details:', {
          message: paystackError.message,
          response: paystackError.response?.data,
          status: paystackError.response?.status,
          statusText: paystackError.response?.statusText,
        });
        throw new BadRequestException(
          `Paystack API Error: ${paystackError.message}`,
        );
      }

      if (!paystackResponse || !paystackResponse.status) {
        this.logger.error('Paystack initialization failed:', paystackResponse);
        throw new BadRequestException(
          `Paystack initialization failed: ${paystackResponse?.message || 'Unknown error'}`,
        );
      }

      // Validate appointment or pharmacy order exists

      let booking: Booking | null = null;

      if (
        createPaymentDto.type === PaymentType.BOOKING &&
        createPaymentDto.bookingId
      ) {
        booking = await this.bookingRepository.findOne({
          where: { id: createPaymentDto.bookingId },
          relations: [
            'patient',
            //'prescription'
          ],
        });
        if (!booking) {
          throw new NotFoundException('booking not found');
        }
      }

      // Save payment record
      const paymentData = {
        fullName: createPaymentDto.fullName,
        email: createPaymentDto.email,
        phoneNumber: createPaymentDto.phoneNumber,
        amount: createPaymentDto.amount,
        type: createPaymentDto.type,
        user: user,
        booking: booking || undefined, // Use undefined instead of null
        paystackReference: reference,
        paystackAccessCode: paystackResponse.data.access_code,
        paystackAuthorizationUrl: paystackResponse.data.authorization_url,
        status: PaymentStatus.PENDING,
        notes: createPaymentDto.notes || undefined,
      };

      const savedPayment = await this.paymentRepository.save(paymentData);
      this.logger.log(`Payment saved with ID: ${savedPayment.id}`);

      return {
        payment: savedPayment,
        paystack_data: {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code,
          reference: reference,
        },
      };
    } catch (error) {
      this.logger.error('Payment initialization failed:', error);

      // Re-throw known errors
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Handle unexpected errors
      throw new BadRequestException(
        `Payment initialization failed: ${error.message}`,
      );
    }
  }

  private generateReference(): string {
    return `PAY_${Date.now()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }

  async updatePaymentStatus(
    reference: string,
    status: PaymentStatus,
  ): Promise<Payment> {
    this.logger.log(
      `Updating payment status for reference: ${reference} to status: ${status}`,
    );
    const payment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
      relations: ['order'],
    });

    if (!payment) {
      this.logger.error(`Payment not found for reference: ${reference}`);
      throw new NotFoundException('Payment not found');
    }

    this.logger.log(`Current payment status: ${payment.status}`);
    payment.status = status;
    const saved = await this.paymentRepository.save(payment);
    this.logger.log(`Payment status after save: ${saved.status}`);
    return saved;
  }

  async verifyPayment(reference: string): Promise<any> {
    try {
      this.logger.log(`Verifying payment for reference: ${reference}`);
      const payment = await this.paymentRepository.findOne({
        where: { paystackReference: reference },
        relations: ['order'],
      });

      if (!payment) {
        this.logger.error(`Payment not found for reference: ${reference}`);
        throw new NotFoundException('Payment not found');
      }

      // Verify with Paystack using axios
      let paystackResponse;
      try {
        const response = await axios.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );
        paystackResponse = response.data;
        this.logger.log(
          `Paystack verify response:`,
          JSON.stringify(paystackResponse, null, 2),
        );
      } catch (paystackError: any) {
        this.logger.error(
          'Paystack Verify API Error:',
          paystackError?.response?.data || paystackError.message,
        );
        throw new BadRequestException(
          `Paystack Verify API Error: ${paystackError?.response?.data?.message || paystackError.message}`,
        );
      }

      this.logger.log(
        `Paystack response status: ${paystackResponse.status}, data.status: ${paystackResponse.data?.status}`,
      );

      if (
        paystackResponse.status &&
        paystackResponse.data.status === 'success'
      ) {
        this.logger.log(
          'Paystack verification success, updating payment status to SUCCESS',
        );
        await this.updatePaymentStatus(reference, PaymentStatus.SUCCESS);

        // Also update the related order's status to 'completed' if it exists
        const payment = await this.paymentRepository.findOne({
          where: { paystackReference: reference },
          relations: ['booking'],
        });
        if (payment && payment.booking) {
          payment.booking.status = 'completed';
          await this.bookingRepository.save(payment.booking);
          this.logger.log(
            `Booking ${payment.booking.id} status updated to 'completed' after successful payment.`,
          );
        }

        return paystackResponse.data;
      } else if (
        paystackResponse.status &&
        paystackResponse.data.status === 'failed'
      ) {
        this.logger.log(
          'Paystack verification failed, updating payment status to FAILED',
        );
        await this.updatePaymentStatus(reference, PaymentStatus.FAILED);
        throw new BadRequestException('Payment failed on Paystack');
      } else {
        this.logger.log(
          'Paystack verification not completed, payment not successful',
        );
        throw new BadRequestException('Payment not completed on Paystack');
      }
    } catch (error) {
      this.logger.error('Payment verification failed', error.stack);
      throw error;
    }
  }

  async getPaymentById(id: string, user: User): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user', 'booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async listPayments(user: User): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { user: { id: user.id } },
      relations: [
        // 'appointment',
        'booking',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // Get all payments (admin only)
  async getAllPayments(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      relations: ['user', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get payments for a specific pharmacy
  async getPaymentsByPharmacy(pharmacyId: number): Promise<Payment[]> {
    return await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.pharmacy', 'pharmacy')
      .where('order.pharmacyId = :pharmacyId', { pharmacyId })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async refundPayment(id: string, user: User): Promise<Payment> {
    const payment = await this.getPaymentById(id, user);

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    try {
      const refundResponse = await paystack.refund.create({
        transaction: payment.paystackReference,
        amount: payment.amount * 100, // Amount in cents (KES)
        currency: 'KES', // Changed from NGN to KES
      });

      if (refundResponse.status) {
        payment.status = PaymentStatus.REFUNDED;
        return await this.paymentRepository.save(payment);
      }

      throw new BadRequestException('Refund failed');
    } catch (error) {
      this.logger.error('Refund failed', error.stack);
      throw error;
    }
  }

  async cancelPayment(id: string, user: User): Promise<Payment> {
    const payment = await this.getPaymentById(id, user);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be cancelled');
    }

    payment.status = PaymentStatus.CANCELLED;
    return await this.paymentRepository.save(payment);
  }

  async updatePayment(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
    user: User,
  ): Promise<Payment> {
    const payment = await this.getPaymentById(id, user);

    Object.assign(payment, updatePaymentDto);
    return await this.paymentRepository.save(payment);
  }

  async deletePayment(id: string, user: User): Promise<void> {
    const payment = await this.getPaymentById(id, user);

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Cannot delete successful payments');
    }

    await this.paymentRepository.remove(payment);
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const hash = crypto
        .createHmac(
          'sha512',
          process.env.PAYSTACK_SECRET_KEY ||
            'sk_test_5b533438ddd2423da733c718b434b2771d9dadd6',
        )
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const { event, data } = payload;

      if (event === 'charge.success') {
        await this.updatePaymentStatus(data.reference, PaymentStatus.SUCCESS);
        this.logger.log(
          `Payment webhook processed: ${data.reference} - SUCCESS`,
        );
      } else if (event === 'charge.failed') {
        await this.updatePaymentStatus(data.reference, PaymentStatus.FAILED);
        this.logger.log(
          `Payment webhook processed: ${data.reference} - FAILED`,
        );
      }
    } catch (error) {
      this.logger.error('Webhook processing failed', error.stack);
      throw error;
    }
  }
}
