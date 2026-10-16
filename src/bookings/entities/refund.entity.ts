import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from '../../users/entities/user.entity';

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  bookingId: number;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  originalAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  refundAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  cancellationFee: number;

  @Column('decimal', { precision: 5, scale: 2 })
  refundPercentage: number;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status: RefundStatus;

  @Column({ nullable: true })
  stripeRefundId: string;

  @Column({ nullable: true })
  paystackRefundId: string;

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column('text', { nullable: true })
  reason: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  processedBy: number;

  @Column('timestamp', { nullable: true })
  processedAt: Date;

  @Column('text', { nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
