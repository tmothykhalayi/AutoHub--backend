import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn,
  JoinColumn 
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { VehicleSpec } from '../../vehicle-spec/entities/vehicle-spec.entity';
import { FleetManagement } from '../../fleet-management/entities/fleet-management.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('vehicles') // ✅ Explicit table name
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  licensePlate: string;

  @Column()
  registrationNumber: string;

  // ✅ FIXED: Added @JoinColumn and proper configuration
  @ManyToOne(() => VehicleSpec, spec => spec.vehicles, { 
    nullable: true,
    onDelete: 'SET NULL' // or 'RESTRICT' based on your needs
  })
  @JoinColumn({ name: 'specId' }) // ✅ ADD THIS
  spec: VehicleSpec;

  @Column({ nullable: true })
  specId: number;

  // ✅ FIXED: Added @JoinColumn
  @ManyToOne(() => Branch, branch => branch.vehicles, { 
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'branchId' }) // ✅ ADD THIS
  branch: Branch;
  
  @Column({ nullable: true })
  branchId: number;

  // ✅ FIXED: Added @JoinColumn
  @ManyToOne(() => FleetManagement, fleet => fleet.vehicles, { 
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'fleetId' }) // ✅ ADD THIS
  fleet: FleetManagement;

  @Column({ nullable: true })
  fleetId: number;

  @Column({ default: 'available' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  mileage: number;
  
  @Column({ default: true })
  isAvailable: boolean;

  @OneToMany(() => Booking, booking => booking.vehicle)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}