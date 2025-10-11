import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity()
export class VehicleSpec {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  seats: number;

  @Column()
  transmission: string;

  @Column()
  fuelType: string;

  @OneToMany(() => Vehicle, vehicle => vehicle.spec)
  vehicles: Vehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



@Entity()
export class VehicleSpec {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Vehicle, vehicle => vehicle.spec)
  vehicles: Vehicle[];
}
