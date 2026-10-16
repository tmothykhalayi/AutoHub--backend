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

export enum PenaltyStatus {
  CALCULATED = 'calculated',
  CHARGED = 'charged',
  PAID = 'paid',
  WAIVED = 'waived',
  DISPUTED = 'disputed',
}

@Entity('late_return_penalties')
export class LateReturnPenalty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  bookingId: number;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column('timestamp')
  expectedReturnDate: Date;

  @Column('timestamp')
  actualReturnDate: Date;

  @Column('int')
  lateHours: number;

  @Column('int')
  lateDays: number;

  // Grace period applied (in hours)
  @Column('int', { default: 0 })
  gracePeriodUsed: number;

  // Billable hours after grace period
  @Column('int')
  billableHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  hourlyRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  dailyRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  penaltyAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  additionalFees: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PenaltyStatus,
    default: PenaltyStatus.CALCULATED,
  })
  status: PenaltyStatus;

  @Column({ nullable: true })
  stripeChargeId: string;

  @Column({ nullable: true })
  paystackChargeId: string;

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  waivedBy: number;

  @Column('timestamp', { nullable: true })
  waivedAt: Date;

  @Column('text', { nullable: true })
  waivedReason: string;

  @Column('timestamp', { nullable: true })
  chargedAt: Date;

  @Column('timestamp', { nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
