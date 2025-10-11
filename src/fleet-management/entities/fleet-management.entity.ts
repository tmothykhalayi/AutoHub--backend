import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity()
export class FleetManagement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  managerName: string;

  @Column({ nullable: true, type: 'text' })
  maintenanceSchedule: string;

  @Column({ nullable: true })
  contactInfo: string;

  @OneToMany(() => Vehicle, vehicle => vehicle.fleet)
  vehicles: Vehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



@Entity()
export class FleetManagement {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Vehicle, vehicle => vehicle.fleet)
  vehicles: Vehicle[];

  @Column()
  managerName: string;

  @Column()
  maintenanceSchedule: string;
}
