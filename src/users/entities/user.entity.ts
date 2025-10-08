import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { Booking } from '../../bookings/entities/booking.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Support } from '../../support/entities/support.entity';
import { Role } from '../../auth/enums/role.enum';

// For backward compatibility
export const UserRole = Role;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  full_name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contact_phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;
  
  @Column({ type: 'varchar', nullable: true })
  otp: string;
  
  @Column({ type: 'varchar', nullable: true })
  secret: string;
  
  @Column({ type: 'timestamp', nullable: true })
  otpExpiry: Date;
  
  @Column({ type: 'varchar', nullable: true })
  hashedRefreshToken: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  // @OneToOne(() => Authentication, auth => auth.user, {
  //   cascade: true,
  //   onDelete: 'CASCADE'
  // })
  // authentication: Authentication;

  @OneToMany(() => Booking, booking => booking.user, {
    onDelete: 'SET NULL'
  })
  bookings: Booking[];

  @OneToMany(() => Payment, payment => payment.user, {
    onDelete: 'SET NULL'
  })
  payments: Payment[];

  @OneToMany(() => Support, ticket => ticket.user, {
    onDelete: 'SET NULL'
  })
  support_tickets: Support[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }
  }

  @BeforeInsert()
  setCreateDate(): void {
    this.created_at = new Date();
  }

  @BeforeUpdate()
  setUpdateDate(): void {
    this.updated_at = new Date();
  }

  // Methods
  getFullName(): string {
    return this.full_name;
  }

  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  canRentVehicle(): boolean {
    return this.is_active && this.email_verified;
  }
}
