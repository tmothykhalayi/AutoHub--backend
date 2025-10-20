import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

//import { Appointment } from 'src/appointments/entities/appointment.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
export enum PaymentType {
  BOOKING = 'BOOKING'
}



@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  type: PaymentType;

  @Column({ unique: true })
  paystackReference: string;

  @Column({ nullable: true })
  paystackAccessCode: string;

  @Column({ nullable: true })
  paystackAuthorizationUrl: string;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  bookingId: number;

  @Column()
  stripePaymentIntentId: string; // To link with Stripe payment intent


  @Column()
  currency: string;


  @OneToOne(() => Booking, (booking) => booking.payment)
  @JoinColumn()
  booking: Booking;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  @Column({ type: 'text', nullable: true })
  notes: string;
}
