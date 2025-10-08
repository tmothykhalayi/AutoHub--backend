import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Booking, booking => booking.payment, { eager: true })
  booking: Booking;

  @ManyToOne(() => User, user => user.payments, { eager: true })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'failed'], default: 'pending' })
  status: 'pending' | 'completed' | 'failed';

  @Column()
  paymentIntentId: string; // Stripe Payment Intent ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
