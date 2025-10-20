import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, user => user.bookings, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Breaking the circular dependency by making payment field nullable and with no cascade
  @OneToOne(() => Payment, (payment) => payment.booking, { nullable: true })
  @JoinColumn({ name: 'paymentId' }) 
  payment: Payment;
  
  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  vehicleId: number;

  @ManyToOne(() => Vehicle, vehicle => vehicle.bookings, { nullable: true })
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





