import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToOne, 
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn 
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;  // Use this as your primary key

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  booking_status: BookingStatus;

  @Column({ type: 'timestamp' })
  booking_date: Date;

  @Column({ type: 'timestamp' })
  return_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'text', nullable: true })
  special_requests?: string;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @Column({ type: 'text', nullable: true })
  admin_notes?: string;

  @Column({ type: 'text', nullable: true })
  additional_drivers?: string;

  // Foreign keys columns
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  vehicle_id: string;

  @Column({ type: 'uuid' })
  location_id: string;

  // Relationships
  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.bookings)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => Location, (location) => location.bookings)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @OneToOne(() => Payment, (payment) => payment.booking)
  @JoinColumn()
  payment: Payment;
}
