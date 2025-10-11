import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Booking } from './booking.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.payments)
  user: User;

  @OneToOne(() => Booking, booking => booking.payment)
  @JoinColumn()
  booking: Booking;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}















@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.payments)
  user: User;

  @OneToOne(() => Booking, booking => booking.payment)
  @JoinColumn()
  booking: Booking;

  @Column()
  amount: number;

  @Column()
  status: string; // e.g., "paid", "pending"
}
