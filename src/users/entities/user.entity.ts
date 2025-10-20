import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Support } from '../../support/entities/support.entity';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Role } from '../../auth/enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
@Column({ nullable: true })
@Exclude({ toPlainOnly: true })
hashedRefreshToken?: string;

@Column({ nullable: true })
@Exclude({ toPlainOnly: true })
otp?: string;

@Column({ nullable: true })
@Exclude({ toPlainOnly: true })
otpExpiry?: Date;

@Column({ nullable: true })
@Exclude({ toPlainOnly: true })
secret?: string;
// Add to your User entity if using IP tracking:
@Column({ nullable: true })
registrationIp: string;

@Column({ default: false })
emailVerified: boolean;
// You may need this instead of `full_name`
get full_name(): string {
  return `${this.firstName} ${this.lastName}`;
}
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ nullable: true })
  phone: string;

  

  @OneToMany(() => Booking, booking => booking.user)
  bookings: Booking[];


  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @OneToMany(() => Support, support => support.user)
  supportTickets: Support[];


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER
  })
  role: Role;


  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}


