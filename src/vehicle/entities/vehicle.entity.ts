import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { VehicleSpec } from '../../vehicle-spec/entities/vehicle-spec.entity';
import { FleetManagement } from '../../fleet-management/entities/fleet-management.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  licensePlate: string;
@Column()
registrationNumber: string;

  @ManyToOne(() => VehicleSpec, spec => spec.vehicles)
  spec: VehicleSpec;

  @ManyToOne(() => Branch, branch => branch.vehicles)
  branch: Branch;

  @ManyToOne(() => FleetManagement, fleet => fleet.vehicles, { nullable: true })
  fleet: FleetManagement;

  @Column({ default: 'available' })
  status: string;

  @Column({ default: 0 })
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
