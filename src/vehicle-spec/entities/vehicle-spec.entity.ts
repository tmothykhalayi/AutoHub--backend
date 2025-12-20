import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity('vehicle_specs')
export class VehicleSpec {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column('int')
  year: number;

  @Column({
    type: 'enum',
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    default: 'petrol',
  })
  fuelType: string;

  @Column('decimal', { precision: 3, scale: 1, nullable: true })
  engineSize: number;

  @Column('int')
  seats: number;

  @Column({
    type: 'enum',
    enum: ['manual', 'automatic'],
    default: 'manual',
  })
  transmission: string;

  @Column('int', { nullable: true })
  doors: number;

  @Column('int', { nullable: true })
  horsepower: number;

  @Column({
    type: 'enum',
    enum: ['Compact', 'Sedan', 'SUV', 'Luxury', 'Sports', 'Electric'],
    default: 'Sedan',
  })
  category: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  features: string[];

  @Column('decimal', { precision: 8, scale: 2 })
  dailyRate: number;

  @Column('decimal', { precision: 8, scale: 2 })
  weeklyRate: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  fuelEfficiency: string;

  // ✅ MUST MATCH Vehicle entity's relationship
  @OneToMany(() => Vehicle, (vehicle) => vehicle.spec)
  vehicles: Vehicle[];
}
