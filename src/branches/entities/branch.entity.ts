import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity()
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => Vehicle, vehicle => vehicle.branch)
  vehicles: Vehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



@Entity()
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Vehicle, vehicle => vehicle.branch)
  vehicles: Vehicle[];
}
