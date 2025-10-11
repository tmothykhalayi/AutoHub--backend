import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { VehicleSpec } from './vehicleSpec.entity';
import { FleetManagement } from './fleetManagement.entity';
import { Booking } from './booking.entity';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  licensePlate: string;

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

  @OneToMany(() => Booking, booking => booking.vehicle)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}





@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Branch, branch => branch.vehicles)
  branch: Branch;

  @ManyToOne(() => VehicleSpec, spec => spec.vehicles)
  spec: VehicleSpec;

  @OneToMany(() => Booking, booking => booking.vehicle)
  bookings: Booking[];

  @ManyToOne(() => FleetManagement, fleet => fleet.vehicles)
fleet: FleetManagement;

}
