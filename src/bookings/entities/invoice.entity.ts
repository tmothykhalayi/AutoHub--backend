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

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  bookingId: number;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column('timestamp')
  issueDate: Date;

  @Column('timestamp')
  dueDate: Date;

  @Column('timestamp', { nullable: true })
  paidDate: Date;

  // Line items
  @Column('jsonb')
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxable: boolean;
  }[];

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  // Tax breakdown
  @Column('jsonb', { nullable: true })
  taxes: {
    name: string;
    rate: number;
    amount: number;
  }[];

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ nullable: true })
  discountReason: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amountDue: number;

  // Location for tax calculation
  @Column({ nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  billingCity: string;

  @Column({ nullable: true })
  billingState: string;

  @Column({ nullable: true })
  billingCountry: string;

  @Column({ nullable: true })
  billingZipCode: string;

  @Column({ nullable: true })
  taxIdentifier: string; // VAT number, Tax ID, etc.

  // PDF
  @Column({ nullable: true })
  pdfUrl: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  terms: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
