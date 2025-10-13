import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Support } from '../../support/entities/support.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
@Column({ nullable: true })
hashedRefreshToken?: string;

@Column({ nullable: true })
otp?: string;

@Column({ nullable: true })
otpExpiry?: Date;

@Column({ nullable: true })
secret?: string;

// You may need this instead of `full_name`
get full_name(): string {
  return `${this.firstName} ${this.lastName}`;
}
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'customer' })
  role: string;

  @OneToMany(() => Booking, booking => booking.user)
  bookings: Booking[];


  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @OneToMany(() => Support, support => support.user)
  supportTickets: Support[];


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

