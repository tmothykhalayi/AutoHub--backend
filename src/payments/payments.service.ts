import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly mailService: MailService
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const payment = this.paymentRepository.create(createPaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);
    
    // Send payment receipt email
    try {
      await this.mailService.sendPaymentReceipt(payment.user.email, {
        name: payment.user.firstName || payment.user.full_name || 'Valued Customer',
        paymentId: savedPayment.id.toString(),
        bookingId: payment.booking?.id?.toString() || 'N/A',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod || 'Card',
        paymentDate: new Date(),
      });
      this.logger.log(`Payment receipt email sent to ${payment.user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send payment receipt email: ${error.message}`);
    }
    
    return savedPayment;
  }

  async findAll() {
    return this.paymentRepository.find({
      relations: ['user', 'booking']
    });
  }

  async findOne(id: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'booking']
    });
    
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    
    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findOne(id);
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: number) {
    const payment = await this.findOne(id);
    return this.paymentRepository.remove(payment);
  }
}
