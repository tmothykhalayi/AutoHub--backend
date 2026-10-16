import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Exclude } from 'class-transformer';
@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  cancellationFee: number;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  pickupLocation: string;

  @Column({ nullable: true })
  dropoffLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  securityDeposit: number;

  @Column({ type: 'int', default: 1 })
  rentalDays: number;
  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.bookings, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => Payment, (payment) => payment.booking, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ nullable: true })
  paymentId: string;

  @Exclude({ toPlainOnly: true })
  isActive?: boolean;

  @Exclude({ toPlainOnly: true })
  isUpcoming?: boolean;

  @Exclude({ toPlainOnly: true })
  isCompleted?: boolean;

  @Exclude({ toPlainOnly: true })
  isCancellable?: boolean;

  @Exclude({ toPlainOnly: true })
  daysRemaining?: number;

  @Column({ nullable: true })
  vehicleId: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.bookings, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column('timestamp')
  startDate: Date;

  @Column('timestamp')
  endDate: Date;

  @Column({ default: 'confirmed' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
