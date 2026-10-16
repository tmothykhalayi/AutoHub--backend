import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cancellation_policies')
export class CancellationPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  // Time before booking start (in hours)
  @Column('int')
  hoursBeforeStart: number;

  // Refund percentage (0-100)
  @Column('decimal', { precision: 5, scale: 2 })
  refundPercentage: number;

  // Cancellation fee (flat amount)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cancellationFee: number;

  // Grace period (in hours) - no penalty
  @Column('int', { default: 24 })
  gracePeriodHours: number;

  @Column({ default: true })
  isActive: boolean;

  // Priority (higher number = higher priority)
  @Column('int', { default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
