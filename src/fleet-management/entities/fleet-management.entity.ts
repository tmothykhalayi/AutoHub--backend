import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity()
export class FleetManagement {
  @Column()
  managerName: string;

  @Column({ nullable: true, type: 'text' })
  maintenanceSchedule: string;

  @Column({ nullable: true })
  contactInfo: string;

  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.fleet)
  vehicles: Vehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
