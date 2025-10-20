import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity()
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  branchCode: string;

  @Column({ nullable: false, default: 'Default Branch Name' })
  name: string;

  @Column()
  address: string;

  @Column({ nullable: false, default: 'Default City' })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: false, default: 'Default Country' })
  country: string;

  @Column({ type: 'float', nullable: false, default: 0 })
  latitude: number;

  @Column({ type: 'float', nullable: false, default: 0 })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  operatingHours: string;

  @Column({ nullable: true, length: 500 })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  manager: string;

  @Column({ nullable: true })
  capacity: number;

  @OneToMany(() => Vehicle, vehicle => vehicle.branch)
  vehicles: Vehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
