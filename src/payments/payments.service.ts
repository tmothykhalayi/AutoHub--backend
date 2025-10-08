import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentsRepository.create(createPaymentDto);
    return await this.paymentsRepository.save(payment);
  }

  async createPayment(bookingId: string, amount: number, userId: string): Promise<Payment> {
    const payment = this.paymentsRepository.create({
      booking: { id: bookingId } as any,
      user: { id: userId } as any,
      amount,
      status: 'pending',
      paymentIntentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
    return await this.paymentsRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return await this.paymentsRepository.find({
      relations: ['booking', 'user'],
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['booking', 'user'],
    });
    
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, updatePaymentDto);
    return await this.paymentsRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentsRepository.remove(payment);
  }
}
