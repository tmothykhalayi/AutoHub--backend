import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.bookings)
  user: User;

  @OneToOne(() => Payment, (payment) => payment.booking, { cascade: true, nullable: true })
  @JoinColumn()
  payment: Payment;

  @ManyToOne(() => Vehicle, vehicle => vehicle.bookings)
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





